import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase, resetToSuperuser, setSessionUser } from './setup-db.js';

const CUSTOMER = '44444444-0000-0000-0000-000000000001';
const OTHER_CUSTOMER = '44444444-0000-0000-0000-000000000002';
const ADMIN = '55555555-0000-0000-0000-000000000001';
const CAIRO = '11111111-0000-0000-0000-000000000001';
const SHAMPOO = '33333333-0000-0000-0000-000000000001';

async function prepare() {
  const db = await createTestDatabase();
  // The lightweight harness does not grant the auth schema to end-user roles.
  await db.exec(`
    GRANT USAGE ON SCHEMA auth TO anon, authenticated;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO anon, authenticated;
    INSERT INTO auth.users (id, email) VALUES
      ('${CUSTOMER}', 'customer@example.com'),
      ('${OTHER_CUSTOMER}', 'other@example.com'),
      ('${ADMIN}', 'admin@reevita.com');
    UPDATE public.profiles SET full_name = 'Customer One', phone = '+201011111111' WHERE id = '${CUSTOMER}';
    UPDATE public.profiles SET full_name = 'Customer Two', phone = '+201022222222' WHERE id = '${OTHER_CUSTOMER}';
    UPDATE public.profiles SET full_name = 'Admin User', phone = '+201099999999', role = 'admin' WHERE id = '${ADMIN}';
  `);
  return db;
}

test('Vertical privilege escalation is denied for customers', async () => {
  const db = await prepare();
  await setSessionUser(db, CUSTOMER);

  await assert.rejects(
    () => db.query("UPDATE public.profiles SET role = 'admin' WHERE id = auth.uid() RETURNING role;"),
    /row-level security policy/,
    'a customer must not be able to promote themselves',
  );

  const role = await db.query('SELECT role FROM public.profiles WHERE id = $1;', [CUSTOMER]);
  assert.equal(role.rows[0].role, 'customer');

  await db.close();
});

test('A blacklisted customer cannot clear their own blacklist flag', async () => {
  const db = await prepare();
  await resetToSuperuser(db);
  await db.exec(`UPDATE public.profiles SET is_blacklisted = TRUE WHERE id = '${CUSTOMER}';`);
  await setSessionUser(db, CUSTOMER);

  await assert.rejects(
    () => db.query('UPDATE public.profiles SET is_blacklisted = FALSE WHERE id = auth.uid();'),
    /row-level security policy/,
  );

  await resetToSuperuser(db);
  const flag = await db.query('SELECT is_blacklisted FROM public.profiles WHERE id = $1;', [CUSTOMER]);
  assert.equal(flag.rows[0].is_blacklisted, true);

  await db.close();
});

test('Customers cannot read or modify another customer profile', async () => {
  const db = await prepare();
  await setSessionUser(db, CUSTOMER);

  const read = await db.query('SELECT id, phone FROM public.profiles WHERE id = $1;', [OTHER_CUSTOMER]);
  assert.equal(read.rows.length, 0, 'RLS must hide other profiles');

  const update = await db.query("UPDATE public.profiles SET full_name = 'x' WHERE id = $1 RETURNING id;", [
    OTHER_CUSTOMER,
  ]);
  assert.equal(update.rows.length, 0, 'RLS must block updates of other profiles');

  await db.close();
});


test('Customers cannot call administrative RPCs or write privileged tables', async () => {
  const db = await prepare();
  await setSessionUser(db, CUSTOMER);

  await assert.rejects(() => db.query('SELECT public.admin_get_metrics();'), /FORBIDDEN/);
  await assert.rejects(() => db.query('SELECT public.admin_get_orders();'), /FORBIDDEN/);
  await assert.rejects(
    () => db.query(`SELECT public.admin_update_inventory('${SHAMPOO}', 9999);`),
    /FORBIDDEN/,
  );
  await assert.rejects(
    () =>
      db.query(`
        INSERT INTO public.products (slug, name, name_ar, description, price)
        VALUES ('customer-product', 'Nope', 'لا', 'not allowed', 1);
      `),
    /row-level security policy/,
  );
  await assert.rejects(
    () =>
      db.query(`
        INSERT INTO public.orders (order_number, customer_name, customer_phone, governorate_id,
          shipping_address_snapshot, subtotal, shipping_fee, total)
        VALUES ('FAKE-1', 'Fake', '+201000000000', '${CAIRO}', '{}'::jsonb, 1, 0, 1);
      `),
    /row-level security policy/,
    'orders must only be created through place_order',
  );

  await db.close();
});

test('Admin RPCs work for an administrator and are audited', async () => {
  const db = await prepare();
  await setSessionUser(db, CUSTOMER);
  const placed = await db.query(
    `SELECT public.place_order($1, $2, NULL, $3, $4, $5, NULL, NULL, $6::jsonb, NULL, $7) AS result;`,
    ['Customer One', '01011111111', CAIRO, 'القاهرة', 'شارع الاختبار 5', JSON.stringify([{ product_id: SHAMPOO, quantity: 1 }]), '12345678-1234-1234-1234-123456789012'],
  );
  const orderId = placed.rows[0].result.order_id;

  await setSessionUser(db, ADMIN);
  const ok = await db.query(
    `SELECT public.admin_update_order_status($1, 'confirmed', 'تأكيد هاتفي', 'Aramex', 'TRK-1') AS result;`,
    [orderId],
  );
  assert.equal(ok.rows[0].result.to_status, 'confirmed');

  const history = await db.query(
    'SELECT to_status FROM public.order_status_history WHERE order_id = $1 ORDER BY created_at;',
    [orderId],
  );
  assert.deepEqual(history.rows.map((row) => row.to_status), ['new', 'confirmed']);

  await assert.rejects(
    () => db.query(`SELECT public.admin_update_order_status($1, 'delivered');`, [orderId]),
    /INVALID_STATUS_TRANSITION/,
    'packed/shipped transitions cannot be skipped',
  );
  await assert.rejects(
    () => db.query(`SELECT public.admin_update_order_status($1, 'not-a-status');`, [orderId]),
    /INVALID_STATUS_TRANSITION/,
  );

  await db.close();
});

test('Anonymous visitors cannot read orders, profiles, audit logs or idempotency claims', async () => {
  const db = await prepare();
  await setSessionUser(db, CUSTOMER);
  await db.query(
    `SELECT public.place_order($1, $2, NULL, $3, $4, $5, NULL, NULL, $6::jsonb, NULL, $7);`,
    ['Customer One', '01011111111', CAIRO, 'القاهرة', 'شارع الاختبار 5', JSON.stringify([{ product_id: SHAMPOO, quantity: 1 }]), '12345678-1234-1234-1234-123456789013'],
  );

  await setSessionUser(db, null);
  for (const table of ['orders', 'order_items', 'order_status_history', 'profiles', 'audit_log', 'order_idempotency']) {
    const res = await db.query(`SELECT count(*) AS count FROM public.${table};`);
    assert.equal(Number(res.rows[0].count), 0, `anon must not read ${table}`);
  }

  // Public availability view stays readable but never exposes quantities.
  const availability = await db.query('SELECT * FROM public.product_availability LIMIT 1;');
  assert.ok(availability.rows.length > 0);
  assert.equal(availability.rows[0].quantity_available, undefined);

  await db.close();
});
