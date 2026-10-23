# REEVITA — Implementation Plan & Change Log

Branch: `cline/xxmgawat` · Base: `main` (`bf20280`)
Companion documents: `PROJECT_AUDIT.md`, `SECURITY_REPORT.md`, `TEST_REPORT.md`.

## Stage A — Discovery (done)
Read the tree, ran the baseline, produced `docs/PROJECT_AUDIT.md`. No application code changed.

## Stage B — Critical fixes (done)
| ID | Change | Files |
| --- | --- | --- |
| AUD-01 | Implemented the missing route tree referenced everywhere in the UI | `src/app/shop/page.tsx`, `track/page.tsx`, `account/page.tsx`, `account/login/page.tsx`, `account/register/page.tsx`, `faq/page.tsx`, `contact/page.tsx`, `about/page.tsx`, `collections/page.tsx`, `collections/[slug]/page.tsx`, `src/lib/shop-filter.ts`, `sitemap.ts` |
| AUD-02 | Server-validated order items returned by the RPC | `supabase/migrations/20261023000008_order_idempotency.sql`, `src/lib/data/orders.ts` |
| AUD-03 | Idempotent COD order creation | same migration, `src/lib/actions/checkout.ts`, `src/components/checkout/checkout-form.tsx` |
| AUD-04 | Brute-force limits on auth endpoints | `src/lib/actions/auth.ts` |
| AUD-05 | Bucket-level upload limits | `supabase/migrations/20261023000009_storage_bucket_hardening.sql` |

## Stage C — Core commerce (done within scope)
* `/shop`: category chips, search, five whitelisted sorts, empty state, `Suspense` toolbar.
* `/collections` → `/shop`; `/collections/[slug]` → `/shop?search=<fragrance>` (previous links 404-ed).
* `/track` reuses the existing hardened tracking action (number + phone, rate limited, no PII leak).
* `/account` shows only the signed-in customer’s orders (`getCustomerOrders`, RLS-scoped in Supabase mode).
* Checkout/cart/COD flow left untouched except idempotency — it was already server-priced and tested.

## Stage D — Security (done within scope)
Idempotency, upload limits, auth rate limits, sitemap accuracy. RLS, CSP, headers and COD semantics
were already correct and are documented as *verified* rather than rewritten.

## Stage E — Testing (mostly done)
New: `tests/unit/shop-filter.test.ts`, `tests/backend/idempotency.test.js`, bucket assertion in
`tests/backend/admin-operations.test.js`, `tests/e2e/storefront.spec.ts`.
Blocked: Playwright execution (missing OS libraries, no root). See `TEST_REPORT.md`.

## Stage F — UI / a11y / SEO (done within scope)
* New pages reuse the existing design tokens/classes (`container-luxe`, `display-xl`, `btn`, `field`, `label`).
* `aria-current` on the active category, `role="status"` on the empty result, real `<h1>` per page.
* `robots` metadata `noindex` on `/track`, `/account*`, `/admin/login`, `/order/*`.
* Sitemap lists only existing URLs.

## Stage G — Deployment readiness (documented)
`.env.example` reviewed (names only), `docs/LAUNCH_CHECKLIST.md`/`RUNBOOK.md` referenced, migration
and rollback notes below. No deployment was performed and none is claimed.

## Migration plan (apply in order)
1. `000001` … `000007` — existing schema/RLS/business logic (already applied in any live project).
2. `000008` — adds `orders.idempotency_key` (nullable, unique partial index), drops and recreates
   `place_order` with an 11th defaulted argument. **Backward compatible**: old calls with 10 args fail
   only if they use positional arguments against the old signature; the app uses named parameters.
3. `000009` — storage bucket size/MIME limits.

### Rollback
* `000009`: `UPDATE storage.buckets SET file_size_limit = NULL, allowed_mime_types = NULL WHERE id='product-images';`
* `000008`: `DROP FUNCTION IF EXISTS public.place_order(TEXT,TEXT,TEXT,UUID,TEXT,TEXT,TEXT,TEXT,JSONB,TEXT,TEXT);`
  then re-apply `000003` to restore the previous function; `ALTER TABLE public.orders DROP COLUMN idempotency_key;`
  (only safe if no client relies on the key). Take a backup before applying anything to production.

## Deliberately not done
* No redesign, no framework/provider migration, no new runtime dependency.
* No invented legal policy pages, no fabricated testimonials or ratings.
* No online payment integration (out of scope; COD only).

---

# Round 2 Change Log

| ID | Change | Files |
| --- | --- | --- |
| AUD-11 | Homepage CTAs link to `/shop` | `src/components/home/reference-home.tsx` |
| AUD-12 | Mobile overflow in product card | `src/components/product/product-card.tsx` |
| AUD-13 | Checkout limits: 20/IP/10min + 5/phone/hour (hashed) | `src/lib/actions/checkout.ts` |
| AUD-14 | `ENABLE ROW LEVEL SECURITY` on `storage.objects` | `supabase/migrations/20261023000010_storage_objects_rls.sql` |
| AUD-15 | Policy pages from configured facts + checkout/footer links | `src/lib/policies.ts`, `src/app/policies/[slug]/page.tsx`, `checkout-form.tsx`, `footer.tsx` |
| AUD-16 | Rootless E2E bootstrap + CI | `scripts/e2e_bootstrap.py`, `.github/workflows/ci.yml` |
| AUD-17 | Demo idempotency, deterministic E2E server | `src/lib/demo/store.ts`, `playwright.config.ts` |
| — | Tests: rollback/replay, privilege escalation, storage authz, cart/admin/duplicate-order E2E | `tests/backend/*`, `tests/unit/demo-idempotency.test.ts`, `tests/e2e/cart-and-admin.spec.ts` |
| — | Test harness now mirrors Supabase storage grants | `tests/backend/setup-db.js` |
| — | Docs + README testing section | `README.md`, `docs/*` |

## Migration 000010
* `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;` — idempotent, no data change.
* Rollback: `ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;` (do **not** do this in
  production — Supabase enables it by default and the policies depend on it).

---

# Round 3 — Release gate preparation

| Item | Change | Files |
| --- | --- | --- |
| Idempotency replay disclosure (High) | Replay bound to phone / order owner; `FORBIDDEN` otherwise | `supabase/migrations/20261023000011_idempotency_owner_binding.sql` |
| Storage migrations could abort on hosted Supabase | Wrapped `ALTER TABLE storage.*` / bucket UPDATE in `DO` blocks that emit `WARNING` + verification hint instead of failing | `…000009_storage_bucket_hardening.sql`, `…000010_storage_objects_rls.sql` |
| Weak auth cookie defaults | `httpOnly`, `sameSite=lax`, `secure` in prod, 60-day maxAge; unused browser client deleted | `src/lib/supabase/cookie-options.ts`, `server.ts`, `middleware.ts`, removal of `client.ts` |
| Rate limiting evidence | Local limiter + Upstash multi-instance + Redis-outage fallback tested | `tests/unit/rate-limit-*.test.ts` |
| Migration repeatability | Re-apply 000008–000011 twice; assert single signature & constraints | `tests/backend/migration-repeatability.test.js` |
| Policy claims trimmed | Removed unverifiable tax/health assertions | `src/lib/policies.ts`, `docs/POLICY_REVIEW.md` |
| Release docs | Staging migration plan, monitoring plan, policy review, runbook/checklist links | `docs/STAGING_MIGRATION_PLAN.md`, `docs/MONITORING.md`, `docs/POLICY_REVIEW.md`, `RUNBOOK.md`, `LAUNCH_CHECKLIST.md` |

## Migration state after Round 3

```
000008  orders.idempotency_key + partial unique index + 11-arg place_order (validated items)
000009  product-images limits (ownership-safe)
000010  storage.objects RLS (ownership-safe)
000011  place_order replay bound to phone/owner  ← supersedes 000008's function body
```

All four are **unapplied** outside the PGlite harness. Apply in this order on staging, then
production, using `docs/STAGING_MIGRATION_PLAN.md`.

## What is explicitly NOT done

* No migration was applied to any Supabase project.
* No deployment, no monitoring activation, no CI run on GitHub.
* No policy text was invented; commercial/legal statements are flagged for approval.

---

# Round 4 — adversarial hardening

| Item | Change | Files |
| --- | --- | --- |
| Replay disclosed PII when the caller knew the phone | Replay minimised: full payload only for `auth.uid() = orders.user_id`; everyone else gets number/status/totals only | `supabase/migrations/20261023000012_replay_minimisation.sql` |
| Confirmation page assumed name/phone/items | Conditional rendering + explanatory note; limited replays no longer overwrite a richer cookie or borrow the browser’s cart snapshot | `src/app/order/[orderNumber]/page.tsx`, `src/lib/actions/checkout.ts`, `src/lib/data/orders.ts`, `src/lib/types.ts` |
| “Green `db push`” ≠ “Storage secured” | Executable gate that exits non-zero on any missing control | `supabase/verification/release_security_checks.sql` |
| Storage authorisation only testable by hand | Scripted API checks (customer denied, admin allowed, MIME rejected, read, delete) | `scripts/verify-storage-api.mjs` |
| Cookie claims unproven | Unit test across environments + E2E browser assertion | `tests/unit/cookie-options.test.ts`, `tests/e2e/account.spec.ts` |
| Adversarial coverage | 8 replay scenarios + 6 gate scenarios | `tests/backend/replay-disclosure.test.js`, `tests/backend/release-checks.test.js` |

## Final migration set

```
000008  idempotency key + partial unique index + 11-arg place_order
000009  bucket limits (ownership-safe, WARNING)
000010  storage.objects RLS (ownership-safe, WARNING)
000011  replay bound to phone/owner            ← superseded
000012  replay minimised to non-personal data ← REQUIRED; 000011 alone leaves S1 open
```

**Apply through 000012**, then run `supabase/verification/release_security_checks.sql` before deploying
any frontend that sends `p_idempotency_key`.
