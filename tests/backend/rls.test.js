import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase, setSessionUser } from './setup-db.js';

test('RLS enforcement: Visitor, Customer, and Admin permissions', async () => {
  const db = await createTestDatabase();

  const customerId = '44444444-0000-0000-0000-000000000001';
  const otherCustomerId = '44444444-0000-0000-0000-000000000002';
  const adminId = '55555555-0000-0000-0000-000000000001';

  // Seed users and profiles
  await db.exec(`
    INSERT INTO auth.users (id, email) VALUES
    ('${customerId}', 'customer@example.com'),
    ('${otherCustomerId}', 'other@example.com'),
    ('${adminId}', 'admin@reevita.com');

    INSERT INTO public.profiles (id, full_name, phone, role) VALUES
    ('${customerId}', 'Customer One', '+201011111111', 'customer'),
    ('${otherCustomerId}', 'Customer Two', '+201022222222', 'customer'),
    ('${adminId}', 'Admin User', '+201099999999', 'admin');
  `);

  // 1. Visitor (anon) tests
  await setSessionUser(db, null);

  // Anon CAN select active products
  const anonProdRes = await db.query('SELECT count(*) as count FROM public.products;');
  assert.ok(Number(anonProdRes.rows[0].count) >= 9, 'Anon can view active products');

  // Anon CANNOT directly read inventory table (restricted to admin)
  const anonInvRes = await db.query('SELECT count(*) as count FROM public.inventory;');
  assert.equal(Number(anonInvRes.rows[0].count), 0, 'Anon should get 0 rows when directly querying inventory table');

  // Anon CANNOT directly insert products
  await assert.rejects(
    async () => {
      await db.query(`
        INSERT INTO public.products (slug, name, name_ar, description, price)
        VALUES ('hack-product', 'Hack', 'اختراق', 'Fake product', 10);
      `);
    },
    /violates row-level security policy/,
    'Anon cannot insert products'
  );

  // Anon CANNOT directly INSERT into orders (must use place_order RPC)
  await assert.rejects(
    async () => {
      await db.query(`
        INSERT INTO public.orders (
          order_number, customer_name, customer_phone, governorate_id,
          shipping_address_snapshot, subtotal, shipping_fee, total
        ) VALUES (
          'FAKE-ORDER', 'Fake', '+201000000000', '11111111-0000-0000-0000-000000000001',
          '{}'::jsonb, 100, 50, 150
        );
      `);
    },
    /violates row-level security policy/,
    'Direct order insertion must be blocked by RLS'
  );

  // 2. Customer Isolation Tests
  // Place order for Customer 1
  await setSessionUser(db, customerId);
  const cairoGovId = '11111111-0000-0000-0000-000000000001';
  const shampooId = '33333333-0000-0000-0000-000000000001';

  await db.query(`
    SELECT public.place_order(
      $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb
    );
  `, [
    'Customer One',
    '01011111111',
    'customer@example.com',
    cairoGovId,
    'القاهرة',
    'شارع التحرير',
    '',
    '',
    JSON.stringify([{ product_id: shampooId, quantity: 1 }])
  ]);

  // Customer 1 sees their own order
  const cust1Orders = await db.query('SELECT count(*) as count FROM public.orders;');
  assert.equal(Number(cust1Orders.rows[0].count), 1, 'Customer 1 should see their own order');

  // Switch to Customer 2: MUST NOT see Customer 1 orders
  await setSessionUser(db, otherCustomerId);
  const cust2Orders = await db.query('SELECT count(*) as count FROM public.orders;');
  assert.equal(Number(cust2Orders.rows[0].count), 0, 'Customer 2 must NOT see Customer 1 orders');

  // 3. Admin Tests
  await setSessionUser(db, adminId);

  // Admin CAN query inventory
  const adminInvRes = await db.query('SELECT count(*) as count FROM public.inventory;');
  assert.ok(Number(adminInvRes.rows[0].count) >= 9, 'Admin can view all inventory rows');

  // Admin CAN view all customer orders
  const adminOrders = await db.query('SELECT count(*) as count FROM public.orders;');
  assert.ok(Number(adminOrders.rows[0].count) >= 1, 'Admin can view all customer orders');

  await db.close();
});
