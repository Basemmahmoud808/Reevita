import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase, resetToSuperuser, setSessionUser } from './setup-db.js';

const CAIRO_GOV_ID = '11111111-0000-0000-0000-000000000001';
const SHAMPOO_ID = '33333333-0000-0000-0000-000000000001';
const OWNER_ID = '77777777-0000-0000-0000-000000000001';
const OTHER_ID = '77777777-0000-0000-0000-000000000002';

const PII_KEYS = ['customer_name', 'customer_phone', 'customer_email', 'order_id', 'items', 'shipping_address_snapshot'];

function orderArgs({ phone = '01012345678', name = 'منى حسن', email = 'mona@example.com', key, items } = {}) {
  return [
    name,
    phone,
    email,
    CAIRO_GOV_ID,
    'مدينة نصر',
    'شارع النصر، عمارة 15، شقة 3',
    '',
    '',
    JSON.stringify(items ?? [{ product_id: SHAMPOO_ID, quantity: 1 }]),
    null,
    key,
  ];
}

async function callPlaceOrder(db, args) {
  const res = await db.query(
    `SELECT public.place_order($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11) AS result;`,
    args,
  );
  return res.rows[0].result;
}

async function seedCustomers(db) {
  await db.exec(`
    INSERT INTO auth.users (id, email) VALUES
      ('${OWNER_ID}', 'owner@example.com'),
      ('${OTHER_ID}', 'other@example.com');
  `);
}

test('scenario 1: the authenticated owner receives the full replay', async () => {
  const db = await createTestDatabase();
  await seedCustomers(db);

  await setSessionUser(db, OWNER_ID);
  const first = await callPlaceOrder(db, orderArgs({ key: 'owner-full-001' }));
  assert.equal(first.limited, undefined, 'a first placement is not a replay');

  const replay = await callPlaceOrder(db, orderArgs({ key: 'owner-full-001' }));
  assert.equal(replay.replayed, true);
  assert.equal(replay.limited, false);
  assert.equal(replay.order_number, first.order_number);
  assert.equal(replay.customer_name, 'منى حسن');
  assert.equal(replay.items.length, 1);
});

test('scenario 2: a different phone number gets only the limited summary', async () => {
  const db = await createTestDatabase();
  const first = await callPlaceOrder(db, orderArgs({ key: 'limited-phone-002' }));

  const replay = await callPlaceOrder(db, orderArgs({ key: 'limited-phone-002', phone: '01099999999', name: 'مهاجم' }));
  assert.equal(replay.replayed, true);
  assert.equal(replay.limited, true);
  assert.equal(replay.order_number, first.order_number);
  for (const key of PII_KEYS) assert.ok(!(key in replay), `${key} must not be disclosed`);
});

test('scenario 3: knowing the victim phone number does NOT unlock the order (unauthenticated)', async () => {
  const db = await createTestDatabase();
  const first = await callPlaceOrder(db, orderArgs({ key: 'phone-not-a-secret-003' }));

  // Same key, same phone, no session — the strongest realistic attacker position.
  const replay = await callPlaceOrder(db, orderArgs({ key: 'phone-not-a-secret-003' }));
  assert.equal(replay.order_number, first.order_number);
  assert.equal(replay.limited, true);
  for (const key of PII_KEYS) assert.ok(!(key in replay), `${key} must not be disclosed`);
});

test('scenario 4: an unauthenticated caller with the key receives no personal data', async () => {
  const db = await createTestDatabase();
  await callPlaceOrder(db, orderArgs({ key: 'anonymous-replay-004' }));

  await setSessionUser(db, null); // role: anon
  const replay = await callPlaceOrder(db, orderArgs({ key: 'anonymous-replay-004' }));
  assert.equal(replay.limited, true);
  const serialised = JSON.stringify(replay);
  assert.ok(!serialised.includes('01012345678'), 'the stored phone must not appear');
  assert.ok(!serialised.includes('منى'), 'the stored name must not appear');
});

test('scenario 5: another authenticated customer cannot read the order', async () => {
  const db = await createTestDatabase();
  await seedCustomers(db);

  await setSessionUser(db, OWNER_ID);
  const first = await callPlaceOrder(db, orderArgs({ key: 'cross-customer-005' }));

  await setSessionUser(db, OTHER_ID);
  const replay = await callPlaceOrder(db, orderArgs({ key: 'cross-customer-005', phone: '01055555555', name: 'عميل آخر' }));
  assert.equal(replay.order_number, first.order_number);
  assert.equal(replay.limited, true);
  for (const key of PII_KEYS) assert.ok(!(key in replay), `${key} must not be disclosed`);

  // The other customer still cannot see the order through RLS either.
  const visible = await db.query(`SELECT count(*)::int AS n FROM public.orders WHERE id = $1;`, [first.order_id]);
  assert.equal(visible.rows[0].n, 0);
});

test('scenario 6: repeated retries never create a second order or double-reserve stock', async () => {
  const db = await createTestDatabase();
  const before = await db.query('SELECT quantity_available FROM public.inventory WHERE product_id = $1;', [SHAMPOO_ID]);

  const key = 'repeat-006';
  const results = [];
  for (let i = 0; i < 5; i += 1) results.push(await callPlaceOrder(db, orderArgs({ key })));

  const numbers = new Set(results.map((r) => r.order_number));
  assert.equal(numbers.size, 1, 'all retries resolve to one order number');
  assert.equal(results.filter((r) => r.replayed === true).length, 4);

  const orders = await db.query('SELECT count(*)::int AS n FROM public.orders;');
  const items = await db.query('SELECT count(*)::int AS n FROM public.order_items;');
  const after = await db.query('SELECT quantity_available FROM public.inventory WHERE product_id = $1;', [SHAMPOO_ID]);
  assert.equal(orders.rows[0].n, 1);
  assert.equal(items.rows[0].n, 1);
  assert.equal(Number(before.rows[0].quantity_available) - Number(after.rows[0].quantity_available), 1);
});

test('scenario 7: replay payloads and error paths carry no sensitive order data', async () => {
  const db = await createTestDatabase();
  await callPlaceOrder(db, orderArgs({ key: 'no-leak-007' }));

  const replay = await callPlaceOrder(db, orderArgs({ key: 'no-leak-007' }));
  const serialised = JSON.stringify(replay);
  for (const needle of ['01012345678', '+201012345678', 'منى', 'مدينة نصر', 'شارع النصر', 'mona@example.com']) {
    assert.ok(!serialised.includes(needle), `replay leaked: ${needle}`);
  }

  // Invalid product: the error names the product id, never customer data.
  await assert.rejects(
    () => callPlaceOrder(db, orderArgs({
      key: 'no-leak-err-007',
      items: [{ product_id: '00000000-0000-0000-0000-000000000000', quantity: 1 }],
    })),
    (error) => {
      assert.ok(!String(error.message).includes('01012345678'));
      assert.ok(!String(error.message).includes('منى'));
      return /PRODUCT_UNAVAILABLE|INVALID_ITEM/.test(error.message);
    },
  );
});

test('scenario 8: the owner is resolved from auth.uid(), never from the payload', async () => {
  const db = await createTestDatabase();
  await seedCustomers(db);

  await setSessionUser(db, OWNER_ID);
  const first = await callPlaceOrder(db, orderArgs({ key: 'payload-owner-008' }));

  // No caller-supplied user id exists in the signature; a different session must stay limited.
  await setSessionUser(db, OTHER_ID);
  const replay = await callPlaceOrder(db, orderArgs({ key: 'payload-owner-008', phone: '01012345678' }));
  assert.equal(replay.limited, true);
  assert.equal(replay.order_number, first.order_number);

  await resetToSuperuser(db);
  const stored = await db.query('SELECT user_id FROM public.orders WHERE order_number = $1;', [first.order_number]);
  assert.equal(stored.rows[0].user_id, OWNER_ID);
});
