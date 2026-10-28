import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase, setSessionUser } from './setup-db.js';

test('Idempotency: Repeated order placement with the same key returns original order and does NOT double-deduct inventory', async () => {
  const db = await createTestDatabase();

  const cairoGovId = '11111111-0000-0000-0000-000000000001';
  const shampooId = '33333333-0000-0000-0000-000000000001'; // initial 50 stock
  const idempotencyKey = 'rv-test-idemp-12345';

  const orderPayload = [
    'ريم خالد',
    '01012349999',
    'reem@example.com',
    cairoGovId,
    'التجمع الخامس',
    'شارع التسعين عمارة 12',
    '',
    '',
    JSON.stringify([{ product_id: shampooId, quantity: 2 }]),
    '127.0.0.1',
    idempotencyKey
  ];

  // First submission
  const firstRes = (await db.query(`
    SELECT public.place_order($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11) as result;
  `, orderPayload)).rows[0].result;

  assert.equal(firstRes.success, true);
  assert.equal(firstRes.is_duplicate, false);
  const originalOrderId = firstRes.order_id;
  const originalOrderNumber = firstRes.order_number;

  // Verify stock: 50 - 2 = 48 available, 2 reserved
  let inv = (await db.query('SELECT quantity_available, quantity_reserved FROM public.inventory WHERE product_id = $1;', [shampooId])).rows[0];
  assert.equal(inv.quantity_available, 48);
  assert.equal(inv.quantity_reserved, 2);

  // Second submission (retry with exact same idempotency key)
  const retryRes = (await db.query(`
    SELECT public.place_order($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11) as result;
  `, orderPayload)).rows[0].result;

  assert.equal(retryRes.success, true);
  assert.equal(retryRes.is_duplicate, true, 'Retry must identify the order as duplicate/idempotent');
  assert.equal(retryRes.order_id, originalOrderId, 'Must return the original order ID');
  assert.equal(retryRes.order_number, originalOrderNumber, 'Must return the original order number');

  // Verify stock was NOT deducted again (still 48 available, 2 reserved!)
  inv = (await db.query('SELECT quantity_available, quantity_reserved FROM public.inventory WHERE product_id = $1;', [shampooId])).rows[0];
  assert.equal(inv.quantity_available, 48, 'Stock must NOT be deducted a second time on idempotent retry');
  assert.equal(inv.quantity_reserved, 2);

  // Verify exactly 1 order row exists in orders table
  const countRes = (await db.query('SELECT count(*) as count FROM public.orders WHERE idempotency_key = $1;', [idempotencyKey])).rows[0];
  assert.equal(Number(countRes.count), 1, 'Only 1 order record must exist in DB');

  await db.close();
});

test('Guest COD Abuse: Refusing delivery persistently blocks future orders from the same guest phone', async () => {
  const db = await createTestDatabase();

  const cairoGovId = '11111111-0000-0000-0000-000000000001';
  const shampooId = '33333333-0000-0000-0000-000000000001';
  const adminId = '55555555-0000-0000-0000-000000000001';
  const guestPhone = '01066667777';

  // Seed admin
  await db.exec(`
    INSERT INTO auth.users (id, email) VALUES ('${adminId}', 'admin@reevita.com');
    UPDATE public.profiles SET role = 'admin' WHERE id = '${adminId}';
  `);

  // Place order as guest (no profile in auth.users / profiles)
  const placeRes = (await db.query(`
    SELECT public.place_order($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb) as result;
  `, [
    'ضيف ريفيتا',
    guestPhone,
    null,
    cairoGovId,
    'المعادي',
    'شارع النصر عمارة 4',
    '',
    '',
    JSON.stringify([{ product_id: shampooId, quantity: 1 }])
  ])).rows[0].result;

  const orderId = placeRes.order_id;

  // Admin confirms, packs, ships order
  await setSessionUser(db, adminId);
  await db.query(`SELECT public.admin_update_order_status($1, 'confirmed');`, [orderId]);
  await db.query(`SELECT public.admin_update_order_status($1, 'packed');`, [orderId]);
  await db.query(`SELECT public.admin_update_order_status($1, 'shipped');`, [orderId]);

  // Delivery refused at door by guest
  await db.query(`SELECT public.admin_update_order_status($1, 'refused');`, [orderId]);

  // Check that guest phone is recorded in blocked_phones table
  const blocked = (await db.query('SELECT * FROM public.blocked_phones WHERE phone = $1;', ['+201066667777'])).rows[0];
  assert.ok(blocked, 'Refused guest phone must be recorded in blocked_phones table');

  // Verify that subsequent order attempt from this phone is immediately rejected with ORDER_REJECTED
  await setSessionUser(db, null);
  await assert.rejects(
    async () => {
      await db.query(`
        SELECT public.place_order($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb);
      `, [
        'ضيف ريفيتا جديد',
        guestPhone,
        null,
        cairoGovId,
        'مدينة نصر',
        'شارع مكرم عبيد',
        '',
        '',
        JSON.stringify([{ product_id: shampooId, quantity: 1 }])
      ]);
    },
    /ORDER_REJECTED/,
    'Future orders from the refused phone must be rejected even if guest has no profile'
  );

  await db.close();
});
