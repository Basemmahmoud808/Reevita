import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase } from './setup-db.js';

const CAIRO_GOV_ID = '11111111-0000-0000-0000-000000000001';
const SHAMPOO_ID = '33333333-0000-0000-0000-000000000001';

async function place(db, [ipArg = null, key = null, items = null] = []) {
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
      JSON.stringify(items ?? [{ product_id: SHAMPOO_ID, quantity: 1 }]),
      ipArg,
      key,
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

test('a failed order leaves no partial order, items or stock changes', async () => {
  const db = await createTestDatabase();
  const before = await db.query(
    'SELECT quantity_available, quantity_reserved FROM public.inventory WHERE product_id = $1;',
    [SHAMPOO_ID],
  );

  // Second line is an unknown product: the whole transaction must roll back,
  // including the inventory reservation made for the valid first line.
  await assert.rejects(
    () => place(db, [null, 'rollback-key-001', [{ product_id: SHAMPOO_ID, quantity: 2 }, { product_id: '00000000-0000-0000-0000-000000000000', quantity: 1 }]]),
  );

  const orders = await db.query('SELECT count(*)::int AS n FROM public.orders;');
  const items = await db.query('SELECT count(*)::int AS n FROM public.order_items;');
  const after = await db.query(
    'SELECT quantity_available, quantity_reserved FROM public.inventory WHERE product_id = $1;',
    [SHAMPOO_ID],
  );

  assert.equal(orders.rows[0].n, 0);
  assert.equal(items.rows[0].n, 0);
  assert.deepEqual(after.rows[0], before.rows[0]);
});

test('a replayed key returns the original order even if the payload changed', async () => {
  const db = await createTestDatabase();
  const key = 'stable-replay-key-42';
  const first = await place(db, [null, key]);

  const replay = await place(db, [null, key, [{ product_id: SHAMPOO_ID, quantity: 3 }]]);
  assert.equal(replay.order_number, first.order_number);
  assert.equal(Number(replay.total), Number(first.total));

  const items = await db.query('SELECT count(*)::int AS n FROM public.order_items;');
  assert.equal(items.rows[0].n, 1);
});

test('an invalid idempotency key is ignored instead of blocking the order', async () => {
  const db = await createTestDatabase();
  const result = await place(db, [null, 'short']);
  assert.equal(result.success, true);
  assert.equal(result.replayed, undefined);
});

test('an idempotency key never discloses an order to a different phone number', async () => {
  const db = await createTestDatabase();
  const key = 'owner-binding-key-001';
  const first = await place(db, [null, key]);
  assert.equal(first.success, true);

  // Same key, different customer number: must fail instead of leaking the order.
  await assert.rejects(
    () => db.query(
      `SELECT public.place_order(
         $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11
       );`,
      [
        'مهاجم', '01099999999', 'attacker@example.com', CAIRO_GOV_ID,
        'مدينة نصر', 'شارع النصر، عمارة 15، شقة 3', '', '',
        JSON.stringify([{ product_id: SHAMPOO_ID, quantity: 1 }]), null, key,
      ],
    ),
    /FORBIDDEN/,
  );

  // No extra order was created by the rejected attempt.
  const orders = await db.query('SELECT count(*)::int AS n FROM public.orders;');
  assert.equal(orders.rows[0].n, 1);
});

test('the same customer replays with a differently formatted phone number', async () => {
  const db = await createTestDatabase();
  const key = 'owner-binding-key-002';
  const first = await place(db, [null, key]);

  const replay = await db.query(
    `SELECT public.place_order($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11) AS result;`,
    [
      'منى حسن', '+20 101 234 5678', 'mona@example.com', CAIRO_GOV_ID,
      'مدينة نصر', 'شارع النصر، عمارة 15، شقة 3', '', '',
      JSON.stringify([{ product_id: SHAMPOO_ID, quantity: 1 }]), null, key,
    ],
  );
  assert.equal(replay.rows[0].result.order_number, first.order_number);
  assert.equal(replay.rows[0].result.replayed, true);
});
