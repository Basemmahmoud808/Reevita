# REEVITA — Project Audit (Stage A)

Date: 2026-10-23 · Branch: `cline/xxmgawat` · Baseline commit: `bf20280`
Method: direct code inspection + real command runs. Every status below is one of
**Verified**, **Partially verified**, **Not tested**, **Blocked**, **Failed**.

## 1. Architecture actually discovered

| Area | Finding |
| --- | --- |
| Framework | Next.js **16.4.2** (App Router, `proxy.ts` middleware convention), React 19.3, TypeScript 5.9 |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`), custom REEVITA design system in `src/app/globals.css` |
| Data | Supabase Postgres + `@supabase/ssr`; **demo mode** (in-memory) when Supabase env vars are absent and `NODE_ENV !== "production"` |
| DB objects | 15 public tables (`products`, `product_images`, `product_variants`, `inventory`, `categories`, `governorates`, `shipping_rates`, `orders`, `order_items`, `order_status_history`, `profiles`, `addresses`, `audit_log`, `newsletter_subscribers`, `site_settings`), 9 migrations, 35 RLS policies, 14 explicit indexes |
| Business logic | `place_order` / `update_order_status` / `track_order` / admin RPCs are `SECURITY DEFINER` PL/pgSQL; prices and stock are computed in the database |
| Payments | COD only (`payment_method = 'cod'`, `payment_status = 'pending'`) — no card fields anywhere |
| Auth | Supabase Auth (email + password) with `profiles.role` (`customer` / `admin`); demo session cookies only outside production |
| Tests | `tsx --test` unit tests, PGlite backend integration tests, Playwright e2e |
| Scripts | `dev`, `build`, `start`, `lint`, `typecheck`, `test:unit`, `test:backend`, `test:e2e`, `verify` |

## 2. Baseline (before any change)

| Command | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS (0 warnings) |
| `npm run test:unit` | PASS 3/3 |
| `npm run test:backend` | PASS 8/8 |
| `npm run build` | PASS |
| `npm audit --omit=dev` | 0 vulnerabilities |

The baseline was green, which is why every finding below was reproduced by inspection or
by issuing real HTTP requests — not inferred from a red build.

## 3. Findings

### AUD-01 — Critical (fixed) — Core routes did not exist
*Affected*: `src/app` route tree, `src/components/home/hero.tsx`, `layout/mobile-menu.tsx`,
`layout/search-overlay.tsx`, `app/order/[orderNumber]/page.tsx`, `app/sitemap.ts`.
*Evidence*: `npm run build` route table listed only `/`, `/products/[slug]`, `/checkout`,
`/order/[orderNumber]`, `/admin/*`, `/auth/callback`. Grep showed links to `/shop`, `/track`,
`/account`, `/account/login`, `/cart`, `/faq`, `/contact`, `/about`, `/collections`,
`/policies/*`. `curl http://127.0.0.1:3100/shop` returned 404 on the pre-fix tree; the
homepage hero CTA, the header search, the empty-cart CTA and the “track your order” link
from the confirmation page were all dead ends.
*Impact*: the storefront could not be browsed or re-entered after checkout — no commercial use.
*Fix*: implemented `/shop` (server-side category/search/sort filtering with URL whitelisting),
`/track`, `/account`, `/account/login`, `/account/register`, `/faq`, `/contact`, `/about`,
`/collections` + `/collections/[slug]` redirects, and corrected `sitemap.ts` to only list routes
that exist. New file `src/lib/shop-filter.ts` keeps the filter pure and unit-testable.
*Verification*: `curl` matrix (all 200 except the intentional 404 case), `tests/unit/shop-filter.test.ts`,
`tests/e2e/storefront.spec.ts`. **Verified**.

### AUD-02 — High (fixed) — Order confirmation trusted browser-supplied prices
*Affected*: `src/lib/actions/checkout.ts`, `src/app/order/[orderNumber]/page.tsx`, `place_order`.
*Evidence*: `place_order` returned no line items, so the action stored a `cartSnapshot` taken
from the request body (name/quantity/price from `localStorage`) in `rv_last_order` and the
confirmation page rendered `unitPrice`/`totalPrice` from it. Totals on the order were correct,
but the displayed lines could be altered by the browser (mismatch between items and total).
*Fix*: migration `000008` returns `items` built from the server-validated `v_validated_items`;
the action now prefers server items and only falls back to the snapshot in demo mode.
*Verification*: `tests/backend/idempotency.test.js` asserts the returned/stored prices come from
the catalogue (350 EGP) regardless of client payload. **Verified**.

### AUD-03 — High (fixed) — No duplicate-order protection
*Affected*: `orders` table, `place_order`, checkout form.
*Evidence*: no idempotency key, no unique constraint; a double click or a back-button resubmit
created two orders and reserved stock twice.
*Fix*: `orders.idempotency_key` + partial unique index, `place_order(..., p_idempotency_key)` with
`pg_advisory_xact_lock` and replay of the original order; the checkout form submits a stable
per-page-load UUID. **Verified** by `tests/backend/idempotency.test.js` (one order, stock unchanged
on replay).

### AUD-04 — High (fixed) — Credential endpoints had no brute-force protection
*Affected*: `src/lib/actions/auth.ts` (`signInAction`, `signUpAction`, `adminSignInAction`).
*Evidence*: checkout/tracking/newsletter were rate limited; the three auth actions were not.
*Fix*: per-IP limits (10 sign-ins / 10 min, 5 sign-ups / 10 min, 6 admin sign-ins / 10 min) using
the existing limiter (Upstash when configured, in-process fallback). **Verified** by typecheck/lint
and code review; the limiter itself is exercised by existing backend-configured paths (**Partly verified**
— no automated test drives 7 failed admin logins).

### AUD-05 — Medium (fixed) — Storage bucket accepted any MIME type / size
*Affected*: `storage.buckets` (`product-images`), `src/lib/actions/admin.ts`.
*Evidence*: `000007` created the bucket with only `public = true`; only the server action checked
`File.type` and 5 MB, so any upload path that skips the action (or a spoofed type) was unbounded.
*Fix*: migration `000009` sets `file_size_limit = 5242880` and
`allowed_mime_types = {image/jpeg,image/png,image/webp}`. **Verified** by `tests/backend/admin-operations.test.js`.
*Residual*: magic-byte sniffing is still not performed; `dangerouslyAllowSVG` stays `false` and the
image optimizer rejects SVG.

### AUD-06 — Medium (open, documented) — Rate limiting is per-instance
*Affected*: `src/lib/security/rate-limit.ts`.
*Evidence*: falls back to an in-memory `Map` when Upstash env vars are unset; on multi-region
serverless each instance has its own counters.
*Mitigation*: set `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` before launch. **Not tested**
(no credentials in this environment).

### AUD-07 — Medium (open) — No end-to-end test execution in this environment
*Affected*: `tests/e2e/*`.
*Evidence*: `npx playwright install chromium` succeeded, but launching the browser fails with
`error while loading shared libraries: libglib-2.0.so.0`; `npx playwright install-deps` needs root
and there is no sudo/apt in this sandbox. **Blocked** — must be run in CI or a workstation.

### AUD-08 — Low (open) — Confirmation cookie is a display cache only
*Affected*: `LAST_ORDER_COOKIE` (`src/lib/orders/constants.ts`).
*Evidence*: the cookie is `httpOnly`, `sameSite=lax`, 30 min, and is not an authorisation token:
the page only renders it when the URL order number matches, and no mutation is performed from it.
Anyone can forge it to see *their own* fake order number, not another customer’s data.
*Recommendation*: keep as-is; real order data can always be re-fetched with number + phone on `/track`.

### AUD-09 — Low (open) — Policies pages intentionally absent
*Affected*: legal/SEO surface.
*Evidence*: `sitemap.ts` used to advertise `/policies/{shipping,returns,privacy,terms}`; those
pages never existed. They were removed from the sitemap rather than filled with invented legal text.
*Owner action*: supply approved policy text (returns window and delivery estimate are already in
`src/data/catalog.json`), then add `src/app/policies/[slug]/page.tsx`.

### AUD-10 — Informational — Demo mode is correctly production-gated
`isDemoMode = !isSupabaseConfigured && NODE_ENV !== "production"`. A production build without
Supabase credentials therefore has **no** demo admin cookie path: `getAdminSession()` falls through
to Supabase and returns `null`. Verified by reading `src/lib/env.ts` and `src/lib/auth/session.ts`.
Still, a production deploy without Supabase vars will simply fail closed (no orders) — it must be
checked in the release checklist (`docs/LAUNCH_CHECKLIST.md`).

## 4. Areas reviewed and found sound

* **Server-side pricing/stock**: `place_order` locks `inventory` rows `FOR UPDATE`, recomputes prices,
  rejects inactive products, validates governorate + shipping rate, and writes header/items/history in
  one transaction. Covered by `place-order.test.js` and `concurrency.test.js`.
* **RLS**: every one of the 15 public tables has RLS enabled; 35 policies; customer/admin/visitor
  separation exercised in `rls.test.js`.
* **COD semantics**: `payment_status` cannot be `paid` on creation; `payment_method` is constrained
  to `cod|online`; no card fields are collected.
* **Order state machine**: explicit transition map in SQL, invalid transitions rejected server-side
  (`order-state-machine.test.js`).
* **Security headers/CSP**: HSTS, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy,
  Permissions-Policy and a nonce-based CSP are set (`next.config.ts`, `src/lib/supabase/middleware.ts`).
  Verified from live response headers.
* **Secrets**: no service-role key or JWT in source; `.env.example` contains names only.
* **Type safety**: `tsc --noEmit` clean, no `any` added by this work.
