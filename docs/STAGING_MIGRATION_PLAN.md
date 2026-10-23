# REEVITA — Staging Migration Plan & Verification (000008 → 000011)

**Status:** prepared, **not executed**. No Supabase project was accessed from this environment
(no credentials). Everything below must be run by the owner against a **staging** project first.

## 1. Current state

| Migration | Purpose | Applied anywhere? |
| --- | --- | --- |
| `…000008_order_idempotency.sql` | `orders.idempotency_key`, partial unique index, 11-arg `place_order` returning validated items | **UNKNOWN — verify with §2** |
| `…000009_storage_bucket_hardening.sql` | 5 MB + jpeg/png/webp limits on `product-images` | **UNKNOWN — verify with §2** |
| `…000010_storage_objects_rls.sql` | explicit `ENABLE ROW LEVEL SECURITY` on `storage.objects` | **UNKNOWN — verify with §2** |
| `…000011_idempotency_owner_binding.sql` | replay only for the same phone / order owner | **Not applied** (created last) |

> Run §2 first. The migrations are re-runnable (proved by
> `tests/backend/migration-repeatability.test.js`), but you still want the starting point before
> touching a shared project.

## 2. Is it already applied? (read-only checks)

```sql
-- 000008
SELECT column_name FROM information_schema.columns
 WHERE table_schema='public' AND table_name='orders' AND column_name='idempotency_key';

SELECT indexname, indexdef FROM pg_indexes
 WHERE schemaname='public' AND indexname='idx_orders_idempotency_key';

SELECT p.oid::regprocedure AS signature
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname='place_order';

-- 000009
SELECT id, public, file_size_limit, allowed_mime_types
  FROM storage.buckets WHERE id='product-images';

-- 000010
SELECT relrowsecurity FROM pg_class
 WHERE relname='objects' AND relnamespace='storage'::regnamespace;

-- 000011
SELECT prosrc LIKE '%Idempotency key does not belong%' AS owner_binding
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname='place_order';
```

Interpretation: column + index + **11-argument** signature ⇒ 000008 applied;
`owner_binding = true` ⇒ 000011 applied; `file_size_limit = 5242880` ⇒ 000009 applied.
`relrowsecurity = true` is the Supabase default and may be true before 000010.

## 3. Pre-flight (staging)

1. Use a **staging** project — never production data.
2. Back up first:
   ```bash
   supabase link --project-ref <STAGING_REF>
   supabase db dump --data-only -f staging-data-$(date +%F).sql
   supabase db dump --schema public,storage -f staging-schema-$(date +%F).sql
   ```
   Or Dashboard → *Database → Backups → Create backup*.
3. Record `supabase migration list`.
4. Create synthetic fixtures (§6). Do not import production customer data.

## 4. Apply order

```
000001 … 000007   already applied in any live project — do not re-run on production
000008            column + index, replaces place_order (11 args)
000009            bucket limits (warns instead of failing without table ownership)
000010            ensures RLS on storage.objects (warns instead of failing without ownership)
000011            replaces place_order again (same signature) with owner binding
```

```bash
supabase db push                  # pending migrations in timestamp order
# or a single file:
psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20261023000011_idempotency_owner_binding.sql
```

**Deployment ordering:** migrations **before** the frontend that sends `p_idempotency_key`. Old
code keeps working against the new functions (the extra argument has a default); new code against an
old database fails with `function place_order(...) does not exist`.

## 5. Post-apply verification SQL

```sql
-- Exactly one signature, 11 args, SECURITY DEFINER, fixed search_path
SELECT p.oid::regprocedure AS signature, p.prosecdef AS security_definer, p.proconfig AS settings
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname='place_order';

-- Execute privilege for the API roles
SELECT has_function_privilege('anon',
         'public.place_order(text,text,text,uuid,text,text,text,text,jsonb,text,text)', 'EXECUTE') AS anon_can_call,
       has_function_privilege('authenticated',
         'public.place_order(text,text,text,uuid,text,text,text,text,jsonb,text,text)', 'EXECUTE') AS auth_can_call;

SELECT indexdef FROM pg_indexes WHERE indexname='idx_orders_idempotency_key';
SELECT id, public, file_size_limit, allowed_mime_types FROM storage.buckets WHERE id='product-images';
SELECT policyname, cmd, roles FROM pg_policies
 WHERE schemaname='storage' AND tablename='objects' ORDER BY policyname;   -- expect 4
SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relkind='r' ORDER BY c.relname;           -- all true
```

If 000009/000010 emitted `WARNING` (ownership), set the same values in the dashboard:
*Storage → product-images → Settings* → 5 MB, `image/jpeg,image/png,image/webp`; and confirm RLS on
`storage.objects`.

## 6. Functional verification on staging (synthetic data only)

Identities: **anonymous**, **customer A**, **customer B**, **admin**. Never use the service-role
key to imitate a customer.

| # | Check | Expected |
| --- | --- | --- |
| 1 | Anonymous `place_order`, valid Cairo governorate, 1 in-stock product | order created, `payment_method='cod'`, `payment_status='pending'`, totals from DB |
| 2 | Same call with the same `p_idempotency_key` | `replayed=true`, same `order_number`, inventory unchanged |
| 3 | Same key, different phone | `FORBIDDEN`, no new order |
| 4 | Two concurrent calls for the last unit | one succeeds, other `INSUFFICIENT_STOCK` |
| 5 | Payload with a tampered price | ignored; stored `order_items.total_price` = catalogue × qty |
| 6 | Order containing an unavailable product | whole order rolled back, stock unchanged |
| 7 | Customer A vs Customer B select orders | A sees its rows, B sees 0 |
| 8 | Customer A sets `profiles.role='admin'` | rejected / unchanged |
| 9 | Customer upload to `product-images`; admin upload | customer denied, admin allowed |
| 10 | Admin status update | only valid transitions, `audit_log` row written |
| 11 | Anonymous reads `inventory` | 0 rows |

Run identity checks with a real customer JWT (e.g. a `supabase-js` script using the signed-in
customer’s access token), never with the service-role key.

Storage: after 000009/000010 an **admin upload, public read, and delete must still work** — this is
the most likely regression, so test it explicitly through the Storage API.

## 7. Rollback

| Migration | Rollback |
| --- | --- |
| 000011 | Re-apply `000008` (restores the previous body, same signature). |
| 000010 | `ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;` — **do not** on Supabase; the default is enabled and the policies depend on it. |
| 000009 | `UPDATE storage.buckets SET file_size_limit=NULL, allowed_mime_types=NULL WHERE id='product-images';` |
| 000008 | Drop the 11-arg function, re-apply `000003`, then `DROP INDEX …; ALTER TABLE public.orders DROP COLUMN idempotency_key;` — **destructive**, prefer a forward-fix. |

## 8. Checklist

- [ ] Staging project selected; production untouched
- [ ] Backup taken and stored outside the project
- [ ] §2 applied-state recorded
- [ ] 000008 applied; §5 checks pass
- [ ] 000009 applied; bucket limits visible
- [ ] 000010 applied; 4 policies present; admin upload/read/delete works
- [ ] 000011 applied; `owner_binding = true`
- [ ] §6 executed with synthetic data
- [ ] Frontend deployed to staging **after** the migrations
- [ ] One COD order placed through the UI, visible in the admin dashboard
