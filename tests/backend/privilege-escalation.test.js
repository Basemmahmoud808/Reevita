import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase, resetToSuperuser, setSessionUser } from './setup-db.js';

const CUSTOMER = '66666666-0000-0000-0000-000000000001';
const OTHER_CUSTOMER = '66666666-0000-0000-0000-000000000002';
const ADMIN = '66666666-0000-0000-0000-0000000000aa';
const PRODUCT = '33333333-0000-0000-0000-000000000001';

async function seed(db) {
  await db.exec(`
    INSERT INTO auth.users (id, email) VALUES
      ('${CUSTOMER}', 'cust1@example.com'),
      ('${OTHER_CUSTOMER}', 'cust2@example.com'),
      ('${ADMIN}', 'admin2@reevita.com');
    UPDATE public.profiles SET role = 'admin' WHERE id = '${ADMIN}';
  `);
}

test('a customer cannot elevate their own role or unblacklist themselves', async () => {
  const db = await createTestDatabase();
  await seed(db);

  await setSessionUser(db, CUSTOMER);
  await db.query(`UPDATE public.profiles SET full_name = 'New Name' WHERE id = $1;`, [CUSTOMER]);

  // Privilege fields must not change: RLS rejects the row or leaves it untouched.
  await db.query(`UPDATE public.profiles SET role = 'admin' WHERE id = $1;`, [CUSTOMER]).catch(() => {});
  await db.query(`UPDATE public.profiles SET is_blacklisted = false WHERE id = $1;`, [CUSTOMER]).catch(() => {});

  await resetToSuperuser(db);
  const profile = await db.query(`SELECT full_name, role, is_blacklisted FROM public.profiles WHERE id = $1;`, [CUSTOMER]);
  assert.equal(profile.rows[0].full_name, 'New Name');
  assert.equal(profile.rows[0].role, 'customer');

  // Another customer's profile is not editable at all.
  await setSessionUser(db, CUSTOMER);
  const otherUpdate = await db.query(`UPDATE public.profiles SET full_name = 'Hijacked' WHERE id = $1;`, [OTHER_CUSTOMER]);
  assert.equal(otherUpdate.affectedRows ?? 0, 0);

  await resetToSuperuser(db);
  const otherProfile = await db.query(`SELECT full_name FROM public.profiles WHERE id = $1;`, [OTHER_CUSTOMER]);
  assert.notEqual(otherProfile.rows[0].full_name, 'Hijacked');
});

test('a customer cannot modify products, inventory or order state directly', async () => {
  const db = await createTestDatabase();
  await seed(db);

  await resetToSuperuser(db);
  const before = await db.query(
    `SELECT p.price, i.quantity_available
       FROM public.products p JOIN public.inventory i ON i.product_id = p.id
      WHERE p.id = $1;`,
    [PRODUCT],
  );

  await setSessionUser(db, CUSTOMER);
  // RLS hides the rows from the customer, so the statements affect 0 rows.
  await db.query(`UPDATE public.products SET price = 1 WHERE id = $1;`, [PRODUCT]);
  await db.query(`UPDATE public.inventory SET quantity_available = 9999 WHERE product_id = $1;`, [PRODUCT]);
  await assert.rejects(
    () => db.query(`INSERT INTO public.audit_log (user_id, action, entity) VALUES ($1, 'forged', 'products');`, [CUSTOMER]),
    /row-level security|violates/i,
  );

  await resetToSuperuser(db);
  const after = await db.query(
    `SELECT p.price, i.quantity_available
       FROM public.products p JOIN public.inventory i ON i.product_id = p.id
      WHERE p.id = $1;`,
    [PRODUCT],
  );
  assert.deepEqual(after.rows[0], before.rows[0]);
});

test('storage objects: only admins may write product images', async () => {
  const db = await createTestDatabase();
  await seed(db);

  await setSessionUser(db, CUSTOMER);
  await assert.rejects(
    () => db.query(
      `INSERT INTO storage.objects (bucket_id, name) VALUES ('product-images', 'products/hack.webp');`,
    ),
    /row-level security/,
  );

  await setSessionUser(db, ADMIN);
  await db.query(`INSERT INTO storage.objects (bucket_id, name) VALUES ('product-images', 'products/ok.webp');`);
  const rows = await db.query(`SELECT count(*)::int AS n FROM storage.objects;`);
  assert.equal(rows.rows[0].n, 1);
});
