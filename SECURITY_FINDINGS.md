# REEVITA — Security Findings Register

**Edition:** OWASP Top 10:**2025** · **Severity scale:** Critical / High / Medium / Low / Informational
**Status legend:** FIXED (verified) · MITIGATED (control added, residual risk documented) · OPEN · ACCEPTED · BLOCKED (environment/credential)

Every finding below was reproduced on an isolated local database (`tests/backend`, PGlite)
and/or the local production build; none was tested against production data.

| ID | Severity | OWASP 2025 | Title | Status |
|---|---|---|---|---|
| C‑01 | Critical | A02, A08 | Production accepted orders with no backend (silently discarded) | FIXED |
| C‑02 | Critical | A06, A08 | Duplicate COD orders on retry/double submit; double inventory deduction | FIXED |
| H‑01 | High | A01 | Core customer routes missing (`/shop`, `/track`, `/account*`, `/collections*`, `/faq`, `/contact`) → 404 on every primary navigation path | FIXED |
| H‑02 | High | A07, A04 | No throttling on login/register/admin login; spoofable IP key defeated the checkout limiter | FIXED |
| H‑03 | High | A06, A10 | Unbounded order payloads; per‑product quantity cap bypassable by repeating product lines; malformed quantities surfaced raw SQL errors | FIXED |
| H‑04 | High | A01, A08 | Confirmation page trusted `LAST_ORDER_COOKIE` contents (fabricated "order confirmed"; totals/items from the browser) | FIXED |
| M‑01 | Medium | A01, A05 | Insufficient‑stock error returned the exact remaining quantity to anonymous callers | FIXED |
| M‑02 | Medium | A07 | Account enumeration via raw provider error on sign‑up | FIXED |
| M‑03 | Medium | A05, A08 | Upload validation trusted the declared MIME type only (SVG/HTML/polyglot possible) | FIXED |
| M‑04 | Medium | A02, A06 | Rate limiter was in‑process only for multi‑instance deployments | MITIGATED |
| M‑05 | Medium | A01 | `site_settings` readable by `anon` for every key | ACCEPTED (documented) |
| M‑06 | Medium | A07, A08 | Demo session cookies are unsigned (demo mode only) | MITIGATED |
| M‑07 | Medium | A09 | No security logging/alerting pipeline | OPEN |
| M‑08 | Medium | A03 | No CI pipeline / automated dependency review in the repository | OPEN |
| M‑09 | Medium | A02 | CSP allows `style-src 'unsafe-inline'` | ACCEPTED (documented) |
| L‑01 | Low | A08 | Confirmation cookie contained customer PII (name, phone, item lines) | FIXED |
| L‑02 | Low | A05 | `admin_update_inventory` sets an absolute quantity, bypassing reservations by design | ACCEPTED (audited) |
| L‑03 | Low | A02 | All HTML is `no-store` (cookies + per‑request nonce) — performance, not security | ACCEPTED |
| L‑04 | Low | A01 | Sitemap advertised non‑existent `/about` and `/policies/*` routes | FIXED |
| L‑05 | Low | A10 | Server actions return a form state instead of an HTTP 429 + `Retry‑After` | ACCEPTED (documented) |
| I‑01 | Info | — | Online payments disabled; no webhook surface exists | INFORMATIONAL |
| I‑02 | Info | — | E2E browser suite not executable in this sandbox | BLOCKED (environment) |

---

## C‑01 — Production without a backend silently discarded orders

**Impact.** With `NODE_ENV=production` and no Supabase credentials, every data function fell
back to the in‑memory demo store: real customers received an "order confirmed" page while
nothing was persisted, and no order could ever be fulfilled.

**Evidence (before).** `src/lib/data/orders.ts` → `if (!isSupabaseConfigured) { return demoPlaceOrder(…) }`;
the same pattern existed in the admin data layer (inventory/status updates "succeeded" in memory).

**Root cause.** Demo mode was defined only as "Supabase missing" plus a non‑production check
for auth, but order/inventory writes did not consult it.

**Fix.** `src/lib/env.ts` now exposes `backendMode` (`supabase` | `demo` | `blocked`).
`placeOrder`, tracking, receipts, customer orders and every admin write refuse to run in
`blocked` mode with `SERVICE_UNAVAILABLE`; demo writes only happen in `demo` mode.
`tests/unit/blocked-backend.test.ts` asserts this (production + no credentials ⇒ rejected).

**Retest.** `npx tsx --test tests/unit/blocked-backend.test.ts` → 3/3 PASS.

---

## C‑02 — Duplicate COD orders / double inventory deduction

**Impact.** `place_order` created a new order and deducted stock on **every** call. A double
click, browser retry or two concurrent submissions produced two COD orders, two courier
dispatches and two stock reservations for one intended purchase. The disabled button was the
only client‑side protection.

**Evidence (before).** No idempotency column, no unique constraint, no request key anywhere
(`supabase/migrations/20261020000003…`; `src/lib/actions/checkout.ts`).

**Fix.**
- New migration `20261028000008_order_idempotency_and_limits.sql`:
  `public.order_idempotency(key PRIMARY KEY, phone, created_at)` with RLS forced and **no
  policies** (SECURITY DEFINER only), plus `orders.idempotency_key` + unique partial index.
- `place_order(..., p_idempotency_key)` claims the key **before any inventory work** in the
  same transaction. A replay returns the stored order (flagged `replayed: true`); a key used
  by a different phone raises `ORDER_REJECTED` (no cross‑customer disclosure). A failed
  attempt rolls the claim back, so the customer can retry.
- Server fallback key (`src/lib/orders/idempotency.ts`): SHA‑256 of phone + governorate +
  address + items + 10‑minute window, used when the client cannot send one (no JS).
- Client key: `crypto.randomUUID()` in `sessionStorage`, rotated after a confirmed order.

**Regression tests.** `tests/backend/idempotency.test.js` (7 tests: same‑key replay returns
the same order with no extra stock movement/rows, different phone rejected, new key creates a
new order, failed attempt releases the claim, receipt privacy, malformed payloads, anon
cannot read claims) and `tests/unit/demo-idempotency.test.ts` (4 tests for demo mode).

---

## H‑01 — Core customer routes did not exist

**Impact.** The hero, product sections, mobile menu, 404 page and order-confirmation page all
linked to `/shop`; the confirmation page linked to `/track`; the mobile menu linked to
`/account`, `/faq`, `/contact`. None of these routes existed, so guests could not browse the
full catalogue, could not track a COD order, and could not sign in — while the sitemap
advertised more missing pages.

**Evidence.** The baseline build route list contained only `/`, `/admin*`, `/checkout`,
`/order/[orderNumber]`, `/products/[slug]`; `curl /shop` → 404.

**Fix.** Added server-rendered pages that reuse the existing components and design tokens:
`/shop` (server-side search/category/fragrance/sort over the trusted catalogue), `/track`
(`TrackForm`), `/account`, `/account/login`, `/account/register`, `/collections`,
`/collections/[slug]`, `/faq`, `/contact`. The sitemap now lists only routes that exist.

**Verification.** `node scripts/http-security-check.mjs` → all 29 sitemap URLs return
`< 400`; `/account` and `/admin*` still redirect to their login pages.

---

## H‑02 — Missing auth throttling + spoofable limiter key

**Impact.** `signInAction`, `signUpAction` and `adminSignInAction` had no rate limiting at all
(credential stuffing against customer and admin accounts). The limiter key came from
`x-real-ip`, which any client can set, so an attacker could rotate the key and defeat the
checkout and tracking limits.

**Evidence.** `src/lib/actions/auth.ts` had no limiter; `clientIp()` returned
`headers.get("x-real-ip")` when present.

**Fix.**
- `clientIp()` trusts only proxy-controlled values: `x-vercel-forwarded-for` when `VERCEL` is
  set, an operator-declared `TRUSTED_IP_HEADER`, otherwise the right-most `X-Forwarded-For`
  hop. A bare `x-real-ip` is ignored.
- `throttle()` applies **two** counters per attempt: per network and per target account
  (hashed). Login 10/15 min, admin login 5/15 min, registration 5/hour.
- Checkout applies per-IP **and** per-phone (hashed) limits; tracking keeps 12/min per IP.
- `hashedKey()` (SHA-256, truncated) keeps phone numbers/emails out of Redis.
- Admin mutations additionally throttle at 60/min per IP as defence-in-depth.

**Regression tests.** `tests/unit/rate-limit-identity.test.ts` (header trust model, hashing),
`tests/unit/rate-limit-behaviour.test.ts` (N allowed → blocked with retry delay, window reset),
`tests/unit/idempotency-key.test.ts` (no phone in key). **Result:** 11/11 PASS.

**Residual.** Distributed counters require Upstash (see M‑04).

---

## H‑03 — Order payloads unbounded, quantity cap bypassable

**Impact.** `place_order` accepted an arbitrary number of line items, and the per-item cap of
10 existed only in the browser. Repeating the same `product_id` with quantity 6 each produced
12+ units; hundreds of lines created hundreds of `order_items` rows (resource abuse);
non-numeric quantities raised raw Postgres cast errors (`invalid input syntax for type integer`).

**Evidence.** Probe against the pre-fix function: 500 duplicate lines and `quantity: 0` /
malformed values produced raw SQL errors; no array length limit existed.

**Fix (migration 000008).** Shape validation before any cast (UUID/integer regex), ≤ 20 lines,
duplicate products aggregated into one quantity per product, the cap of 10 applied to the
aggregate, deterministic `ORDER BY product_id` locking to avoid deadlocks, and domain error
codes (`INVALID_ITEM`, `EMPTY_CART`) instead of SQL errors. Zod mirrors the same limits.

**Regression tests.** `tests/backend/idempotency.test.js` (malformed payload suite),
`tests/backend/place-order.test.js` (cap + duplicate aggregation). **PASS.**

---

## H‑04 — Confirmation page trusted client-supplied cookie data

**Impact.** `LAST_ORDER_COOKIE` contained the whole order (name, phone, totals, items) and
`/order/[orderNumber]` rendered it without server verification. Any HTTP client can set a
cookie, so a visitor could see an "ORDER CONFIRMED" page for an order that does not exist — a
data-integrity failure on the most sensitive customer screen.

**Fix.** The cookie now stores only `{ orderNumber, phone }`. The page re-reads the order via
`public.get_order_receipt(order_number, phone)` (requires both values; returns items/totals
only — no address, no email). A mismatch shows "not available" with no order details.

**Regression tests.** `tests/backend/idempotency.test.js` → "Order receipt requires both order
number and phone, and never returns address data". **PASS.**


---

## M‑01 — Stock level disclosure through error messages

**Before.** `quantity 9999` returned
`INSUFFICIENT_STOCK: Product "Aloe Vera Shampoo" only has 50 item(s) in stock (requested 9999)`
to an anonymous caller — exact inventory, contradicting the `product_availability` design that
deliberately hides quantities (competitor scraping, demand inference).

**Fix.** The message names the product only. The regression test asserts the error matches
`INSUFFICIENT_STOCK` **and does not contain the stock number**
(`tests/backend/place-order.test.js`).

## M‑02 — Account enumeration on sign-up

The raw Supabase `error.message` (e.g. "User already registered") was returned to the browser.
A generic message is returned now and the provider error is logged server-side only. Verified by
inspection/typecheck; no live Auth provider was available to exercise it.

## M‑03 — Upload validation trusted MIME only

`PRODUCT_IMAGE_TYPES.has(file.type)` accepted HTML/SVG labelled `image/jpeg`. Added
`src/lib/security/image-upload.ts`: 5 MB cap, type allowlist (JPEG/PNG/WebP) and magic-byte
signature match; SVG is rejected. Used by both create and replace actions.
`tests/unit/image-upload.test.ts` → 4/4 PASS.

## M‑04 — Limiter is per-instance unless Redis is configured

`rateLimit()` uses Upstash REST counters when `UPSTASH_REDIS_REST_URL`/`_TOKEN` are present and
falls back to an in-process map (logged) otherwise. Code supports the distributed path;
**enabling it is a deployment action item** (documented in `.env.example` and `docs/RUNBOOK.md`).
Not verified against a real Redis instance in this environment.

## M‑05 — `site_settings` world-readable (accepted)

Policy `site_settings_public_read USING (TRUE)` exposes every key to `anon`. Current seed keys
are store contact/COD/return configuration — no secrets. Accepted; recommend an allow-listed
view if operational settings are ever added.

## M‑06 — Unsigned demo cookies (mitigated)

`rv_demo_user` / `rv_demo_admin` are unsigned values, so anyone can forge a demo session. Demo
mode requires a non-production `NODE_ENV` and production writes now fail closed (C‑01).
Residual: never run `next dev` on a publicly reachable host.

## M‑07 — No security logging/alerting (open)

Errors go to `console.error`; there is no structured log pipeline, no alert on repeated 429/5xx
and no dashboard over `audit_log`. Recommendation: ship logs to the host/observability service,
alert on 5xx/429 spikes and unexpected `audit_log` actions, retain order lifecycle events.

## M‑08 — No CI pipeline (open)

No `.github/workflows` exists; `npm audit` is clean today but nothing enforces it. Recommended
gate: `npm ci && npm run verify && npm audit --audit-level=high`, then
`npx playwright install --with-deps chromium && npm run test:e2e`, with dependency review on PRs.

## M‑09 — CSP `style-src 'unsafe-inline'` (accepted)

Scripts use a per-response nonce + `strict-dynamic`; `object-src`/`frame-ancestors` are locked
down. Inline styles stay allowed for Tailwind/inline style attributes; moving to style nonces
needs build changes and is not claimed as done.

## L‑01 — PII in the confirmation cookie (fixed)

Previously name, phone, totals and item names were stored client-side for 30 minutes. Now only
the order number and phone are stored (needed for the verified receipt lookup).

## L‑02 — Admin inventory override (accepted)

`admin_update_inventory` sets `quantity_available` absolutely and writes an `audit_log` entry.
It intentionally ignores `quantity_reserved`; admins must reconcile reservations during
stock-take. Documented for operations.

## L‑03 — All HTML is `no-store` (accepted)

Pages depend on cookies/nonce, so `Cache-Control: no-store` is emitted. Correct for personalized
pages; storefront caching needs a CDN strategy outside this change.

## L‑04 — Sitemap advertised missing routes (fixed)

`/about` and `/policies/*` were listed but never implemented. Removed; the HTTP check now fetches
every listed URL (29/29 resolve).

## L‑05 — Server actions cannot return HTTP 429 (accepted)

`useActionState` actions return `code: "RATE_LIMITED"` with a retry hint in minutes; automated
callers see HTTP 200 with an error payload. Accepted for the current UX; a route handler would
allow proper `429`/`Retry-After` semantics.

---

## Verification commands used for this register

```bash
npm run typecheck && npm run lint
npm run test:unit          # 25/25 PASS
npm run test:backend       # 21/21 PASS
npm run build              # 24 routes
node scripts/http-security-check.mjs --base-url http://127.0.0.1:3200   # 26/26 PASS
node scripts/load-test.mjs --levels 5,10,25,50 --requests-per-user 6
npm audit                  # 0 vulnerabilities
```

**Result:** 11/11 PASS.
