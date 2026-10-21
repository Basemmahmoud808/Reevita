import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase, setSessionUser, resetToSuperuser } from './setup-db.js';

test('Order State Machine, Inventory Auto-Restoration, and Secure Tracking', async () => {
  const db = await createTestDatabase();

  const cairoGovId = '11111111-0000-0000-0000-000000000001';
  const shampooId = '33333333-0000-0000-0000-000000000001';
  const adminId = '55555555-0000-0000-0000-000000000001';
  const customerId = '66666666-0000-0000-0000-000000000001';

  // Seed admin & customer (migration 000006 auto-creates profiles from auth.users)
  await db.exec(`
    INSERT INTO auth.users (id, email) VALUES
    ('${adminId}', 'admin@reevita.com'),
    ('${customerId}', 'customer@example.com');
  `);

  await db.exec(`
    UPDATE public.profiles SET full_name = 'Admin REEVITA', phone = '+201099999999', role = 'admin' WHERE id = '${adminId}';
    UPDATE public.profiles SET full_name = 'Mahmoud Hassan', phone = '+201055555555' WHERE id = '${customerId}';
  `);

  // Place order for 2 bottles of shampoo (stock: 50 -> 48 available, 2 reserved)
  const placeRes = await db.query(`
    SELECT public.place_order(
      $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb
    ) as result;
  `, [
    'محمود حسن',
    '01055555555',
    'mahmoud@example.com',
    cairoGovId,
    'القاهرة',
    'شارع رمسيس عمارة 10',
    '',
    '',
    JSON.stringify([{ product_id: shampooId, quantity: 2 }])
  ]);

  const orderData = placeRes.rows[0].result;
  const orderId = orderData.order_id;
  const orderNumber = orderData.order_number;

  // Check initial stock
  let inv = (await db.query('SELECT quantity_available, quantity_reserved FROM public.inventory WHERE product_id = $1;', [shampooId])).rows[0];
  assert.equal(inv.quantity_available, 48);
  assert.equal(inv.quantity_reserved, 2);

  // 1. Test Disallowed transition: new -> delivered directly MUST fail
  await setSessionUser(db, adminId);
  await assert.rejects(
    async () => {
      await db.query(`
        SELECT public.admin_update_order_status($1, 'delivered');
      `, [orderId]);
    },
    /INVALID_STATUS_TRANSITION/,
    'Should reject illegal transition directly from new to delivered'
  );

  // 2. Normal Lifecycle: new -> confirmed -> packed -> shipped
  await db.query(`SELECT public.admin_update_order_status($1, 'confirmed', 'Customer confirmed via phone');`, [orderId]);
  await db.query(`SELECT public.admin_update_order_status($1, 'packed', 'Package prepared at warehouse');`, [orderId]);
  await db.query(`
    SELECT public.admin_update_order_status(
      $1, 'shipped', 'Handed to courier', 'Bosta', 'TRK-BOSTA-12345'
    );
  `, [orderId]);

  // Verify status is shipped and tracking info stored
  const shippedOrder = (await db.query('SELECT status, shipping_carrier, tracking_number FROM public.orders WHERE id = $1;', [orderId])).rows[0];
  assert.equal(shippedOrder.status, 'shipped');
  assert.equal(shippedOrder.shipping_carrier, 'Bosta');
  assert.equal(shippedOrder.tracking_number, 'TRK-BOSTA-12345');

  // 3. Test Secure Public Tracking
  await setSessionUser(db, null); // Visitor / Anon tracking
  const trackValid = (await db.query(`
    SELECT public.track_order($1, $2) as result;
  `, [orderNumber, '01055555555'])).rows[0].result;

  assert.equal(trackValid.found, true);
  assert.equal(trackValid.order_number, orderNumber);
  assert.equal(trackValid.status, 'shipped');
  assert.equal(trackValid.tracking_number, 'TRK-BOSTA-12345');
  assert.ok(trackValid.status_ar.includes('الشحنة مع مندوب'));
  assert.equal(trackValid.customer_phone, undefined, 'Must NOT leak customer phone in tracking result');
  assert.equal(trackValid.shipping_address_snapshot, undefined, 'Must NOT leak full customer address in tracking result');

  // Tracking with wrong phone: MUST return found: false
  const trackWrongPhone = (await db.query(`
    SELECT public.track_order($1, $2) as result;
  `, [orderNumber, '01011111111'])).rows[0].result;
  assert.equal(trackWrongPhone.found, false);

  // 4. Refusal Handling & Stock Restoration
  // When courier reports customer refused at door:
  await setSessionUser(db, adminId);
  await db.query(`SELECT public.admin_update_order_status($1, 'refused', 'Customer refused parcel at door');`, [orderId]);

  // Verify stock auto-restored (48 + 2 = 50 available, 0 reserved)
  inv = (await db.query('SELECT quantity_available, quantity_reserved FROM public.inventory WHERE product_id = $1;', [shampooId])).rows[0];
  assert.equal(inv.quantity_available, 50, 'Stock must be automatically restored to available upon refusal');
  assert.equal(inv.quantity_reserved, 0, 'Reserved stock must be 0 upon refusal');

  // Verify refusal flagged in customer profile
  const profile = (await db.query('SELECT is_blacklisted, notes FROM public.profiles WHERE phone = $1;', ['+201055555555'])).rows[0];
  assert.equal(profile.is_blacklisted, true, 'Customer who refused COD delivery must be flagged');
  assert.ok(profile.notes.includes('Refused delivery'));

  await db.close();
});
