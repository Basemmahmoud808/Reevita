import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase, setSessionUser } from './setup-db.js';

test('Admin Operations: Order listing, KPI metrics, inventory updates, and audit logging', async () => {
  const db = await createTestDatabase();

  const adminId = '55555555-0000-0000-0000-000000000001';
  const customerId = '77777777-0000-0000-0000-000000000001';
  const cairoGovId = '11111111-0000-0000-0000-000000000001';
  const shampooId = '33333333-0000-0000-0000-000000000001';

  // Seed users (profiles are created by the auth.users trigger from migration 000006)
  await db.exec(`
    INSERT INTO auth.users (id, email) VALUES
    ('${adminId}', 'admin@reevita.com'),
    ('${customerId}', 'user@reevita.com');
  `);

  await db.exec(`
    UPDATE public.profiles SET full_name = 'Store Admin', phone = '+201099999999', role = 'admin' WHERE id = '${adminId}';
    UPDATE public.profiles SET full_name = 'Normal User', phone = '+201088888888' WHERE id = '${customerId}';
  `);

  // Place a test order
  await db.query(`
    SELECT public.place_order(
      $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb
    );
  `, [
    'Normal User',
    '01088888888',
    'user@reevita.com',
    cairoGovId,
    'القاهرة',
    'شارع مصطفى النحاس',
    '',
    '',
    JSON.stringify([{ product_id: shampooId, quantity: 1 }])
  ]);

  // 1. Non-admin calls must be rejected
  await setSessionUser(db, customerId);
  await assert.rejects(
    async () => {
      await db.query('SELECT public.admin_get_orders();');
    },
    /FORBIDDEN/,
    'Non-admin must not access admin_get_orders'
  );

  await assert.rejects(
    async () => {
      await db.query('SELECT public.admin_get_metrics();');
    },
    /FORBIDDEN/,
    'Non-admin must not access admin_get_metrics'
  );

  // 2. Admin calls
  await setSessionUser(db, adminId);

  // Test admin_get_orders
  const ordersResult = (await db.query('SELECT public.admin_get_orders() as res;')).rows[0].res;
  assert.equal(ordersResult.total_count, 1, 'Should find 1 order');
  assert.equal(ordersResult.orders.length, 1);
  assert.equal(ordersResult.orders[0].customer_phone, '+201088888888');
  assert.equal(ordersResult.orders[0].items.length, 1);

  // Test admin_get_metrics
  const metricsResult = (await db.query('SELECT public.admin_get_metrics() as res;')).rows[0].res;
  assert.equal(metricsResult.total_orders, 1);
  assert.equal(Number(metricsResult.total_sales_egp), 400.00); // 350 + 50 shipping
  assert.equal(metricsResult.orders_by_status.new, 1);
  assert.equal(typeof metricsResult.low_stock_count, 'number');

  // Test admin_update_inventory + audit log
  const updateInvRes = (await db.query(`
    SELECT public.admin_update_inventory($1, 100, 10) as res;
  `, [shampooId])).rows[0].res;
  assert.equal(updateInvRes.success, true);
  assert.equal(updateInvRes.new_quantity, 100);

  // Check audit log for inventory update
  const auditInv = (await db.query(`
    SELECT * FROM public.audit_log WHERE action = 'UPDATE_STOCK' AND entity_id = $1;
  `, [shampooId])).rows[0];
  assert.ok(auditInv, 'Audit log entry must be recorded for stock update');
  assert.equal(auditInv.user_id, adminId);
  assert.equal(auditInv.details.new_quantity, 100);

  // Test admin_update_shipping_rate + audit log
  const updateShippingRes = (await db.query(`
    SELECT public.admin_update_shipping_rate($1, 60.00, 1200.00) as res;
  `, [cairoGovId])).rows[0].res;
  assert.equal(updateShippingRes.success, true);
  assert.equal(Number(updateShippingRes.shipping_cost), 60.00);

  // Check audit log for shipping update
  const auditShipping = (await db.query(`
    SELECT * FROM public.audit_log WHERE action = 'UPDATE_SHIPPING_RATE' AND entity_id = $1;
  `, [cairoGovId])).rows[0];
  assert.ok(auditShipping, 'Audit log entry must be recorded for shipping rate update');
  assert.equal(Number(auditShipping.details.new_cost), 60.00);

  await db.close();
});
