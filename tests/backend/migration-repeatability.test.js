import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTestDatabase } from './setup-db.js';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MIGRATIONS = path.join(ROOT_DIR, 'supabase', 'migrations');
const REPEATABLE = [
  '20261023000008_order_idempotency.sql',
  '20261023000009_storage_bucket_hardening.sql',
  '20261023000010_storage_objects_rls.sql',
  '20261023000011_idempotency_owner_binding.sql',
];

test('the release migrations can be re-applied without breaking the schema', async () => {
  const db = await createTestDatabase();

  for (const file of REPEATABLE) {
    const sql = fs.readFileSync(path.join(MIGRATIONS, file), 'utf-8');
    await db.exec(sql);
    await db.exec(sql);
  }

  // Exactly one place_order signature must remain (no accidental overload).
  const signatures = await db.query(`
    SELECT count(*)::int AS n
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'place_order';
  `);
  assert.equal(signatures.rows[0].n, 1, 'place_order must keep a single signature');

  // The hardened constraints still exist after re-application.
  const index = await db.query(
    "SELECT count(*)::int AS n FROM pg_indexes WHERE indexname = 'idx_orders_idempotency_key';",
  );
  assert.equal(index.rows[0].n, 1);

  const bucket = await db.query(
    "SELECT file_size_limit, allowed_mime_types FROM storage.buckets WHERE id = 'product-images';",
  );
  assert.equal(Number(bucket.rows[0].file_size_limit), 5242880);
  assert.deepEqual([...bucket.rows[0].allowed_mime_types].sort(), ['image/jpeg', 'image/png', 'image/webp']);

  const rls = await db.query(
    "SELECT relrowsecurity FROM pg_class WHERE relname = 'objects' AND relnamespace = 'storage'::regnamespace;",
  );
  assert.equal(rls.rows[0].relrowsecurity, true);
});
