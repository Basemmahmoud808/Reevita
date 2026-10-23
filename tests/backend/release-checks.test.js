import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTestDatabase } from './setup-db.js';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CHECKS = fs.readFileSync(
  path.join(ROOT_DIR, 'supabase/verification/release_security_checks.sql'),
  'utf-8',
);

const runChecks = (db) => db.exec(CHECKS);

test('release gate passes on a fully migrated database', async () => {
  const db = await createTestDatabase();
  await runChecks(db);
});

test('release gate FAILS when the bucket limits were never applied', async () => {
  const db = await createTestDatabase();
  // Simulates 000009 downgrading to WARNING because the migration role did not own the table.
  await db.exec(`UPDATE storage.buckets SET file_size_limit = NULL, allowed_mime_types = NULL WHERE id = 'product-images';`);
  await assert.rejects(() => runChecks(db), /FAIL: product-images file_size_limit/);
});

test('release gate FAILS when a MIME type is missing', async () => {
  const db = await createTestDatabase();
  await db.exec(`UPDATE storage.buckets SET allowed_mime_types = ARRAY['image/jpeg','image/png'] WHERE id='product-images';`);
  await assert.rejects(() => runChecks(db), /FAIL: product-images allowed_mime_types/);
});

test('release gate FAILS when RLS is disabled on storage.objects', async () => {
  const db = await createTestDatabase();
  await db.exec('ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;');
  await assert.rejects(() => runChecks(db), /FAIL: RLS is not enabled on storage.objects/);
});

test('release gate FAILS when a storage policy is missing', async () => {
  const db = await createTestDatabase();
  await db.exec('DROP POLICY "product_images_admin_delete" ON storage.objects;');
  await assert.rejects(() => runChecks(db), /FAIL: expected 4 product-images storage policies/);
});

test('release gate FAILS when place_order is still the pre-000012 body', async () => {
  const db = await createTestDatabase();
  const old = fs.readFileSync(
    path.join(ROOT_DIR, 'supabase/migrations/20261023000011_idempotency_owner_binding.sql'),
    'utf-8',
  );
  await db.exec(old);
  await assert.rejects(() => runChecks(db), /FAIL: place_order does not contain the hardened replay logic/);
});
