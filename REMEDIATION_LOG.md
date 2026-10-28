# REEVITA — Remediation Log

Chronological record of every change made during this audit, with the evidence that it works.
Branch: `cline/ad7k4cke` · base: `bf20280`. No unrelated UI/redesign work was performed.

---

## Step 0 — Baseline (before any edit)

```text
npm run typecheck   PASS
npm run lint        PASS
npm run test:unit   PASS  3/3
npm run test:backend PASS 8/8
npm run build       PASS  17 routes
npm audit           0 vulnerabilities
npm run test:e2e    BLOCKED — Chromium cannot start (libglib-2.0.so.0 missing, no root)
```

No pre-existing code failure was found; the E2E blocker is environmental (finding I‑02).

---

## Step 1 — Database: idempotency, input limits, receipts, admin validation

**File added:** `supabase/migrations/20261028000008_order_idempotency_and_limits.sql`

1. `public.order_idempotency(key PK, phone, created_at)` — RLS enabled + **forced**, no policies,
   `REVOKE ALL … FROM anon, authenticated` (SECURITY DEFINER only).
2. `orders.idempotency_key` + partial unique index `uq_orders_idempotency_key`.
3. `place_order` replaced (old 10‑arg signature dropped explicitly to avoid an ambiguous overload):
   - claims the key before any inventory work; replays the stored order when the same phone retries;
     rejects a key reused by another phone; failed attempts roll the claim back;
   - validates name/city/address/notes/landmark/email lengths;
   - validates item shape (UUID + integer regex) before casting, ≤ 20 lines, duplicate products
     aggregated, ≤ 10 units per product, deterministic `ORDER BY product_id` locking;
   - the stock error no longer contains the remaining quantity.
4. `get_order_receipt(order_number, phone)` — SECURITY DEFINER, both identifiers required, returns
   items/totals only (no address/email).
5. `admin_update_order_status` recreated: status whitelist, field length checks, `FOR UPDATE` row
   lock before reading the old status.

**Verification**

```text
tests/backend/idempotency.test.js ............... 7/7 PASS (new)
tests/backend/place-order.test.js ............... PASS (cap + duplicate aggregation + no stock leak)
tests/backend/concurrency.test.js ............... PASS (last unit, two buyers)
npm run test:backend ............................. 21/21 PASS
```

The migration applies cleanly from scratch (`migrations.test.js`) and is additive: no existing row
is modified or deleted.

---

## Step 2 — Application: idempotency plumbing

| File | Change |
|---|---|
| `src/lib/orders/idempotency.ts` (new) | `normalizeIdempotencyKey`, `deriveIdempotencyKey` (SHA‑256 of phone/address/items + 10‑min window) |
| `src/lib/data/orders.ts` | `placeOrder(payload, ip, key)` → `p_idempotency_key`; returns `replayed`; `getOrderReceipt()`; blocked‑backend guard |
| `src/lib/actions/checkout.ts` | reads/validates `idempotencyKey`; drops the display‑only `cartSnapshot`; cookie now stores only `{orderNumber, phone}` |
| `src/components/checkout/checkout-form.tsx` | hidden key from `sessionStorage` (`crypto.randomUUID`) written via a ref (no re-render) |
| `src/components/cart/clear-cart-on-mount.tsx` | rotates the key after a confirmed order |
| `src/app/order/[orderNumber]/page.tsx` | renders only from `get_order_receipt` (demo fallback) |
| `src/lib/demo/store.ts` | demo replay registry + quantity caps |
| `src/lib/validation.ts` | `MAX_ITEM_QUANTITY`, `MAX_ORDER_LINES`, optional `idempotencyKey` schema |

**Verification:** `tests/unit/idempotency-key.test.ts` (4), `tests/unit/demo-idempotency.test.ts` (4),
`tests/unit/checkout-schema.test.ts` (unchanged, still PASS).

---

## Step 3 — Fail‑closed production mode

| File | Change |
|---|---|
| `src/lib/env.ts` | `backendMode: "supabase" \| "demo" \| "blocked"`, `canPersistWrites` |
| `src/lib/data/orders.ts` | `blocked` → `SERVICE_UNAVAILABLE` for orders/tracking/receipts/customer orders |
| `src/lib/data/admin.ts` | demo branches require `backendMode === "demo"`; every write throws `SERVICE_UNAVAILABLE` unless Supabase is configured |

**Verification:** `tests/unit/blocked-backend.test.ts` → 3/3 PASS (`NODE_ENV=production`, no Supabase
env ⇒ order/tracking/receipt refused). Observed log:

---

## Step 4 — Rate limiting and authentication hardening

| File | Change |
|---|---|
| `src/lib/security/rate-limit.ts` | `clientIp()` trusts only proxy-managed headers (`VERCEL` + `x-vercel-forwarded-for`, `TRUSTED_IP_HEADER`, right-most `X-Forwarded-For`); `hashedKey()` (SHA-256) |
| `src/lib/actions/auth.ts` | throttling on login (10/15 min), admin login (5/15 min), registration (5/h) keyed per IP **and** per hashed account; generic sign-up error (no enumeration); provider error logged only |
| `src/lib/actions/checkout.ts` | per-IP **and** per-hashed-phone checkout limits with a retry hint |
| `src/lib/actions/admin.ts` | mutation throttle (60/min) inside the admin guard |
| `.env.example` | documented `TRUSTED_IP_HEADER` |

**Verification:** `tests/unit/rate-limit-identity.test.ts` (5),
`tests/unit/rate-limit-behaviour.test.ts` (2) → PASS.

---

## Step 5 — Upload validation

| File | Change |
|---|---|
| `src/lib/security/image-upload.ts` (new) | 5 MB cap, JPEG/PNG/WebP allowlist, magic-byte signature check, MIME↔bytes match, extension derived from bytes |
| `src/lib/actions/admin.ts` | create + replace image actions use `validateProductImage`; MIME-only checks removed |

**Verification:** `tests/unit/image-upload.test.ts` → 4/4 PASS.

---

## Step 6 — Restore missing customer journeys

Added (reusing existing components/design tokens, no redesign):
`/shop`, `/track`, `/account`, `/account/login`, `/account/register`, `/collections`,
`/collections/[slug]`, `/faq`, `/contact`; `src/app/sitemap.ts` now lists only existing routes.

**Verification:** `npm run build` → 24 routes; `scripts/http-security-check.mjs` → all 29 sitemap
URLs return `< 400`; `/account` and `/admin*` redirect to their login pages.

---

## Step 7 — Deployment gates and observability helpers (new scripts)

| File | Purpose |
|---|---|
| `scripts/http-security-check.mjs` | 26 assertions: headers, CSP nonce, admin/account protection, 404 handling, stack-trace leakage, sitemap integrity, cache headers, noindex on login |
| `scripts/load-test.mjs` | bounded, localhost-only load ladder with p50/p95/p99, status distribution, JSON output |
| `package.json` | `test:http`, `load:test`; `verify` now includes unit tests |

**Verification:** `node scripts/http-security-check.mjs` → **26/26 PASS**;
`node scripts/load-test.mjs --levels 5,10,25,50` → 0 % errors, results in
`docs/evidence/load-test-results.json`.

---

## Step 8 — Documented but intentionally not changed

| Item | Reason |
|---|---|
| `site_settings` public read | No secrets stored; changing it could break storefront config reads. Recommendation recorded. |
| CSP `style-src 'unsafe-inline'` | Needs build/framework changes; scripts are already nonce-protected. |
| Absolute inventory set by admins | Business workflow; every change is audited. |
| Legal pages (`/about`, `/policies/*`) | Owner-approved copy required; removed from the sitemap instead of inventing legal text. |
| Upstash / logging / CI | Need infrastructure or credentials unavailable here; exact steps provided. |
| E2E suite | Blocked by missing system libraries in this sandbox; specs untouched. |


---

## Files touched (complete list)

```text
src/lib/env.ts
src/lib/validation.ts
src/lib/types.ts
src/lib/orders/idempotency.ts                      (new)
src/lib/security/rate-limit.ts
src/lib/security/image-upload.ts                   (new)
src/lib/data/orders.ts
src/lib/data/admin.ts
src/lib/demo/store.ts
src/lib/actions/checkout.ts
src/lib/actions/auth.ts
src/lib/actions/admin.ts
src/components/checkout/checkout-form.tsx
src/components/cart/clear-cart-on-mount.tsx
src/app/order/[orderNumber]/page.tsx
src/app/shop/page.tsx                              (new)
src/app/track/page.tsx                             (new)
src/app/account/page.tsx                           (new)
src/app/account/login/page.tsx                     (new)
src/app/account/register/page.tsx                  (new)
src/app/collections/page.tsx                       (new)
src/app/collections/[slug]/page.tsx                (new)
src/app/faq/page.tsx                               (new)
src/app/contact/page.tsx                           (new)
src/app/sitemap.ts
supabase/migrations/20261028000008_order_idempotency_and_limits.sql (new)
tests/backend/idempotency.test.js                  (new)
tests/backend/privilege-escalation.test.js         (new)
tests/backend/place-order.test.js                  (updated: cap semantics + no stock leak)
tests/unit/idempotency-key.test.ts                 (new)
tests/unit/rate-limit-identity.test.ts             (new)
tests/unit/rate-limit-behaviour.test.ts            (new)
tests/unit/image-upload.test.ts                    (new)
tests/unit/demo-idempotency.test.ts                (new)
tests/unit/blocked-backend.test.ts                 (new)
scripts/load-test.mjs                              (new)
scripts/http-security-check.mjs                    (new)
package.json, .env.example
SECURITY_AUDIT.md, SECURITY_FINDINGS.md, ORDER_FLOW_AUDIT.md,
LOAD_TEST_REPORT.md, REMEDIATION_LOG.md            (new)
docs/evidence/load-test-results.json               (new)
```

One existing test was updated (`tests/backend/place-order.test.js`): its 999-unit request is now
rejected by the per-product cap rather than by stock. The test now covers both cases and adds the
"no stock disclosure" assertion — a deliberate behaviour change (A06/A10), not a test weakening.

---

## Final verification run

```text
npm run typecheck ................ PASS
npm run lint ..................... PASS
npm run test:unit ................ 25/25 PASS
npm run test:backend ............. 21/21 PASS
npm run build .................... PASS (24 routes)
scripts/http-security-check.mjs .. 26/26 PASS
scripts/load-test.mjs ............ 0% errors, 5→50 users
npm audit ........................ 0 vulnerabilities
npm run test:e2e ................. BLOCKED (environment, documented)
```

**No issue in this log is marked "fixed" without a passing regression test above.**

`[reevita] order rejected: backend not configured in production`.
