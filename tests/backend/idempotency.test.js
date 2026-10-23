import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase } from './setup-db.js';

const CAIRO_GOV_ID = '11111111-0000-0000-0000-000000000001';
const SHAMPOO_ID = '33333333-0000-0000-0000-000000000001';

async function place(db, extraArgs = []) {
  const res = await db.query(
    `SELECT public.place_order(
       $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11
     ) as result;`,
    [
      'منى حسن',
      '01012345678',
      'mona@example.com',
      CAIRO_GOV_ID,
      'مدينة نصر',
      'شارع النصر، عمارة 15، شقة 3',
      'بجوار النادي الأهلي',
      '',
      JSON.stringify([{ product_id: SHAMPOO_ID, quantity: 1 }]),
      ...extraArgs,
    ],
  );
  return res.rows[0].result;
}

test('place_order is idempotent for a repeated submission key', async () => {
  const db = await createTestDatabase();
  const key = '2f0f3f5e-6d1a-4d8f-9a0f-abc123456789';

  const first = await place(db, [null, key]);
  assert.equal(first.success, true);
  const stockAfterFirst = await db.query(
    'SELECT quantity_available FROM public.inventory WHERE product_id = $1;',
    [SHAMPOO_ID],
  );

  // Same key (double click / retry) must return the original order and not touch stock.
  const second = await place(db, [null, key]);
  assert.equal(second.replayed, true);
  assert.equal(second.order_number, first.order_number);

  const stockAfterSecond = await db.query(
    'SELECT quantity_available FROM public.inventory WHERE product_id = $1;',
    [SHAMPOO_ID],
  );
  assert.equal(stockAfterSecond.rows[0].quantity_available, stockAfterFirst.rows[0].quantity_available);

  const orders = await db.query('SELECT count(*)::int AS n FROM public.orders;');
  assert.equal(orders.rows[0].n, 1);
});

test('place_order returns server-validated items and prices (ignores client prices)', async () => {
  const db = await createTestDatabase();
  const result = await place(db, [null, 'key-validated-items-001']);

  assert.ok(Array.isArray(result.items));
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].product_name, 'Aloe Vera Shampoo');
  assert.equal(Number(result.items[0].unit_price), 350);
  assert.equal(Number(result.items[0].total_price), 350);

  const orderId = result.order_id;
  const stored = await db.query(
    'SELECT total_price FROM public.order_items WHERE order_id = $1;',
    [orderId],
  );
  assert.equal(Number(stored.rows[0].total_price), 350);
});
