import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase } from './setup-db.js';

const CAIRO = '11111111-0000-0000-0000-000000000001';
const SHAMPOO = '33333333-0000-0000-0000-000000000001';

function placeOrder(db, { key, phone = '01012345678', items = [{ product_id: SHAMPOO, quantity: 1 }] }) {
  return db.query(
    `SELECT public.place_order($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, NULL, $10) AS result`,
    ['عميلة اختبار', phone, null, CAIRO, 'مدينة نصر', 'شارع الاختبار 12', null, null, JSON.stringify(items), key],
  );
}

async function stockOf(db) {
  const res = await db.query(
    'SELECT quantity_available, quantity_reserved FROM public.inventory WHERE product_id = $1;',
    [SHAMPOO],
  );
  return { available: res.rows[0].quantity_available, reserved: res.rows[0].quantity_reserved };
}

test('Idempotent checkout: a retried request returns the same order without side effects', async () => {
  const db = await createTestDatabase();
  const key = '11111111-2222-3333-4444-555555555555';
  const before = await stockOf(db);

  const first = await placeOrder(db, { key });
  assert.equal(first.rows[0].result.success, true);
  assert.equal(first.rows[0].result.replayed, false);

  const afterFirst = await stockOf(db);
  assert.equal(afterFirst.available, before.available - 1, 'first attempt reserves one unit');

  const second = await placeOrder(db, { key });
  assert.equal(second.rows[0].result.replayed, true, 'retry must be flagged as a replay');
  assert.equal(
    second.rows[0].result.order_number,
    first.rows[0].result.order_number,
    'retry must return the original order number',
  );

  const afterRetry = await stockOf(db);
  assert.deepEqual(afterRetry, afterFirst, 'a replay must not touch inventory again');

  const orders = await db.query('SELECT count(*) AS count FROM public.orders;');
  assert.equal(Number(orders.rows[0].count), 1, 'a replay must not create a second order');

  const items = await db.query('SELECT count(*) AS count FROM public.order_items;');
  assert.equal(Number(items.rows[0].count), 1, 'a replay must not duplicate order items');

  await db.close();
});

test('Idempotency key cannot be replayed by a different phone number (no cross-customer disclosure)', async () => {
  const db = await createTestDatabase();
  const key = 'aaaaaaaa-2222-3333-4444-555555555555';
  await placeOrder(db, { key, phone: '01011111111' });

  await assert.rejects(
    () => placeOrder(db, { key, phone: '01099999999' }),
    /ORDER_REJECTED/,
    'a key used by another phone number must be rejected, not replayed',
  );

  const orders = await db.query('SELECT count(*) AS count FROM public.orders;');
  assert.equal(Number(orders.rows[0].count), 1);

  await db.close();
});

test('A new idempotency key still creates a new legitimate order', async () => {
  const db = await createTestDatabase();
  const first = await placeOrder(db, { key: 'bbbbbbbb-2222-3333-4444-555555555555' });
  const second = await placeOrder(db, { key: 'cccccccc-2222-3333-4444-555555555555' });

  assert.notEqual(first.rows[0].result.order_number, second.rows[0].result.order_number);
  assert.equal(second.rows[0].result.replayed, false);
  assert.equal(second.rows[0].result.success, true);

  const orders = await db.query('SELECT count(*) AS count FROM public.orders;');
  assert.equal(Number(orders.rows[0].count), 2);

  await db.close();
});

test('A rejected checkout releases its idempotency claim so the same key can be retried', async () => {
  const db = await createTestDatabase();
  const key = 'dddddddd-2222-3333-4444-555555555555';

  await assert.rejects(
    () => placeOrder(db, { key, items: [{ product_id: SHAMPOO, quantity: 11 }] }),
    /INVALID_ITEM|INSUFFICIENT_STOCK/,
  );

  const claims = await db.query('SELECT count(*) AS count FROM public.order_idempotency;');
  assert.equal(Number(claims.rows[0].count), 0, 'failed attempts must roll the claim back');

  const retry = await placeOrder(db, { key, items: [{ product_id: SHAMPOO, quantity: 1 }] });
  assert.equal(retry.rows[0].result.replayed, false);
  assert.equal(retry.rows[0].result.success, true);

  await db.close();
});

test('Order receipt requires both order number and phone, and never returns address data', async () => {
  const db = await createTestDatabase();
  const placed = await placeOrder(db, { key: 'eeeeeeee-2222-3333-4444-555555555555' });
  const orderNumber = placed.rows[0].result.order_number;

  const ok = await db.query('SELECT public.get_order_receipt($1, $2) AS result;', [orderNumber, '01012345678']);
  assert.equal(ok.rows[0].result.found, true);
  assert.equal(ok.rows[0].result.order_number, orderNumber);
  assert.equal(ok.rows[0].result.items.length, 1);
  assert.equal(ok.rows[0].result.address_line, undefined, 'receipt must not expose the address');

  const wrongPhone = await db.query('SELECT public.get_order_receipt($1, $2) AS result;', [
    orderNumber,
    '01099999999',
  ]);
  assert.equal(wrongPhone.rows[0].result.found, false);

  await db.close();
});

test('Order input validation: malformed payloads return domain errors, not raw SQL errors', async () => {
  const db = await createTestDatabase();

  await assert.rejects(
    () => placeOrder(db, { key: 'ffffffff-2222-3333-4444-555555555555', items: 'not-an-array' }),
    /EMPTY_CART|INVALID_ITEM/,
  );

  await assert.rejects(
    () =>
      placeOrder(db, {
        key: '99999999-2222-3333-4444-555555555555',
        items: [{ product_id: 'not-a-uuid', quantity: 1 }],
      }),
    /INVALID_ITEM/,
  );

  await assert.rejects(
    () =>
      placeOrder(db, {
        key: '88888888-2222-3333-4444-555555555555',
        items: Array.from({ length: 21 }, () => ({ product_id: SHAMPOO, quantity: 1 })),
      }),
    /at most 20 line items/,
  );

  await assert.rejects(
    () => placeOrder(db, { key: 'not a valid key!!', items: [{ product_id: SHAMPOO, quantity: 1 }] }),
    /Invalid idempotency key/,
  );

  await db.close();
});

test('Anonymous visitors cannot read the idempotency claim table', async () => {
  const db = await createTestDatabase();
  const { setSessionUser, resetToSuperuser } = await import('./setup-db.js');
  await placeOrder(db, { key: '77777777-2222-3333-4444-555555555555' });

  await setSessionUser(db, null);
  const anon = await db.query('SELECT count(*) AS count FROM public.order_idempotency;');
  assert.equal(Number(anon.rows[0].count), 0, 'anon must not see idempotency claims');

  await resetToSuperuser(db);
  const owner = await db.query('SELECT count(*) AS count FROM public.order_idempotency;');
  assert.equal(Number(owner.rows[0].count), 1);

  await db.close();
});
