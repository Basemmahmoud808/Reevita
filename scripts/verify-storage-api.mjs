#!/usr/bin/env node
/**
 * API-level Storage authorisation check (run by the owner against staging).
 *
 * Proves that the *Storage API* — not just the SQL catalogue — enforces the release rules:
 *   - an anonymous/customer session cannot upload to `product-images`;
 *   - an admin session can upload, read the public URL and delete;
 *   - the bucket rejects a disallowed MIME type even for an admin.
 *
 * Required env (never printed):
 *   SUPABASE_URL, SUPABASE_ANON_KEY,
 *   STAGING_CUSTOMER_EMAIL, STAGING_CUSTOMER_PASSWORD,
 *   STAGING_ADMIN_EMAIL, STAGING_ADMIN_PASSWORD
 *
 * Usage: node scripts/verify-storage-api.mjs
 * Exit code 0 = all checks passed, 1 = a check failed or credentials are missing.
 */
import { createClient } from "@supabase/supabase-js";

const required = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "STAGING_CUSTOMER_EMAIL",
  "STAGING_CUSTOMER_PASSWORD",
  "STAGING_ADMIN_EMAIL",
  "STAGING_ADMIN_PASSWORD",
];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`BLOCKED: missing env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const bucket = "product-images";
const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} — ${name}${detail ? ` (${detail})` : ""}`);
}

async function signIn(email, password) {
  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
  return client;
}

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const stamp = Date.now();

const customer = await signIn(process.env.STAGING_CUSTOMER_EMAIL, process.env.STAGING_CUSTOMER_PASSWORD);
const admin = await signIn(process.env.STAGING_ADMIN_EMAIL, process.env.STAGING_ADMIN_PASSWORD);

// 1. customer upload must be denied by the storage policy
const customerUpload = await customer.storage.from(bucket).upload(`products/test-customer-${stamp}.png`, png, {
  contentType: "image/png",
  upsert: false,
});
record("customer upload is denied", Boolean(customerUpload.error), customerUpload.error?.message ?? "upload unexpectedly succeeded");

// 2. admin upload must succeed
const adminPath = `products/test-admin-${stamp}.png`;
const adminUpload = await admin.storage.from(bucket).upload(adminPath, png, { contentType: "image/png", upsert: false });
record("admin upload succeeds", !adminUpload.error, adminUpload.error?.message ?? "");

// 3. public read of the uploaded object
const publicUrl = admin.storage.from(bucket).getPublicUrl(adminPath).data.publicUrl;
const publicRead = await fetch(publicUrl);
record("public read of product image", publicRead.ok, `HTTP ${publicRead.status}`);

// 4. bucket rejects a disallowed MIME type (bucket limits, not app validation)
const badUpload = await admin.storage.from(bucket).upload(`products/test-bad-${stamp}.txt`, Buffer.from("hello"), {
  contentType: "text/plain",
  upsert: false,
});
record("disallowed MIME type is rejected", Boolean(badUpload.error), badUpload.error?.message ?? "text/plain was accepted");

// 5. customer delete must be denied
const customerDelete = await customer.storage.from(bucket).remove([adminPath]);
record("customer delete is denied", Boolean(customerDelete.error) || (customerDelete.data ?? []).length === 0, customerDelete.error?.message ?? "no rows removed");

// 6. admin cleanup must succeed
const adminDelete = await admin.storage.from(bucket).remove([adminPath]);
record("admin delete succeeds", !adminDelete.error, adminDelete.error?.message ?? "");

await customer.auth.signOut();
await admin.auth.signOut();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} storage checks passed`);
process.exit(failed.length === 0 ? 0 : 1);
