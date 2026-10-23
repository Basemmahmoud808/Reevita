# REEVITA — Security Report (OWASP Top 10:2025)

Scope: the code in this repository plus live HTTP responses from a local dev server.
No penetration test was performed against a live Supabase project (no credentials available).
Statuses: **Verified**, **Partially verified**, **Not tested**, **Blocked**.

## A01:2025 — Broken Access Control
* **Verified**: 15/15 public tables have `ENABLE ROW LEVEL SECURITY`; 35 policies in
  `20261020000002_rls_policies.sql` (+1 in `000006`) separate visitor / customer / admin.
  `tests/backend/rls.test.js` exercises all three roles.
* **Verified**: `getAdminSession()` reads `profiles.role`; admin server actions all call `guard()`
  before touching data; RLS re-checks `public.is_admin()`.
* **Verified**: customers only ever see their own orders — `getCustomerOrders` relies on RLS-scoped
  `orders`; there is no order-id parameter taken from the URL anywhere in customer code.
  Public order lookup requires **order number + phone** (`track_order` RPC).
* **Verified**: `/account` and `/admin` redirect anonymous users (307 → `/account/login`, `/admin/login`).
* **Verified**: product image upload/update/delete policies are admin-only; the bucket is public **read-only**.
* **Residual**: none known.

## A02:2025 — Security Misconfiguration
* **Verified** live headers: `Content-Security-Policy` (nonce + `strict-dynamic`, `object-src 'none'`,
  `frame-ancestors 'none'`, `form-action 'self'`), `Strict-Transport-Security` (2 y, preload),
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
  `Permissions-Policy` (payment/camera/mic disabled), `poweredByHeader: false`.
* **Verified**: `.env.example` documents names only; no secret value in the repo or client bundle
  (`grep` for `eyJhbGciOi` / `service_role` finds only documentation prose).
* **Verified**: demo mode cannot be enabled in a production build (`NODE_ENV !== "production"` guard),
  so the `rv_demo_admin` cookie is not an admin path on Vercel production.
* **Not tested**: live CORS/domain configuration of the Supabase project, preview-deployment isolation.

## A03:2025 — Software Supply Chain
* **Verified**: `npm audit --omit=dev` → 0 vulnerabilities; `package-lock.json` committed; versions pinned
  with carets as per project convention.
* **Not tested**: CI/CD workflow permissions (no workflow files in the repo).
* **Recommended**: enable Dependabot/`npm audit` in CI, review Supabase/Vercel project member access.

## A04:2025 — Cryptographic Failures
* **Verified**: authentication and password hashing are delegated to Supabase Auth (no custom crypto).
* **Verified**: session cookies are handled by `@supabase/ssr`; the app’s own cookie (`rv_last_order`)
  is `httpOnly`, `sameSite=lax`, `secure` in production, 30-minute lifetime, and holds no token.
* **Verified**: no credential/token logging; error handlers log messages, not payloads.
* **Residual**: TLS/HSTS is terminated at the host (Vercel); verified only via response headers locally.

## A05:2025 — Injection
* **Verified**: all SQL lives in migrations; the app talks to Postgres exclusively through
  `supabase-js`/RPC (parameterised). No string-concatenated SQL.
* **Verified**: all server action inputs pass Zod schemas (`checkoutSchema`, `loginSchema`,
  `registerSchema`, `admin*Schema`).
* **Verified**: no `dangerouslySetInnerHTML` on user data; React escapes by default; CSP blocks inline script
  without the per-request nonce.
* **Verified**: upload filenames are replaced with `crypto.randomUUID()` + derived extension.

## A06:2025 — Insecure Design
* **Verified**: prices, shipping, discounts and stock are recomputed inside `place_order`; the browser
  cannot influence totals.
* **Verified**: stock is locked `FOR UPDATE`; `concurrency.test.js` proves only one of two buyers gets the
  last unit.
* **Verified (new)**: duplicate submissions are absorbed by an idempotency key + advisory lock.
* **Verified**: checkout 5 / 10 min per IP; tracking 12 / min; newsletter 5 / 10 min; auth 5–10 / 10 min.

## A07:2025 — Authentication Failures
* **Verified**: Supabase Auth (no bespoke auth), `getUser()` used for server-side JWT validation,
  sign-out clears the session, admin login rejects non-admin roles.
* **Verified (new)**: brute-force limits on customer login, sign-up and admin login.
* **Partial**: account enumeration is mitigated only by Supabase’s generic error (`Invalid login credentials`
  → Arabic generic message). Supabase’s own built-in rate limits apply.
* **Not tested**: password-reset flow (Supabase-hosted email; no mailbox access here).

## A08:2025 — Software & Data Integrity
* **Verified**: order totals/status changes are validated in SQL; status changes go through an explicit
  transition map and are rejected otherwise.
* **Verified**: admin cannot silently change a placed order’s price (no RPC/policy permits it).
* **Verified (new)**: bucket-level size/MIME limits.
* **Verified**: client-side role/price tampering has no effect (role comes from `profiles`, prices from DB).

## A09:2025 — Logging & Alerting
* **Verified**: security-relevant denials and failures are logged server-side via `console.error`
  (`[reevita] …`), admin actions are written to `audit_log` (`admin-operations.test.js`), customer-facing
  errors stay generic Arabic strings.
* **Residual / limitation**: no external error-monitoring service is configured, so there is no alerting.
  `docs/RUNBOOK.md` documents where to plug Sentry/Vercel log drains. **Not tested** (no account).

## A10:2025 — Mishandling of Exceptional Conditions
* **Verified**: `place_order` is a single transaction — a failure rolls back stock, order, items and history
  (`tests/backend` failure cases).
* **Verified**: the confirmation page is only reached after a successful RPC; on error the user stays on
  checkout with an explicit message and their typed values.
* **Verified**: internal error details are never returned to customers (`ORDER_ERROR_MESSAGES` maps codes
  to friendly Arabic text).
* **Verified (new)**: a replayed request returns the original order instead of a second one.

## Additional controls
| Control | Status |
| --- | --- |
| CSRF | **Verified (design)**: mutations are Next.js server actions (POST + framework action id) and Supabase cookies are `SameSite=Lax`; no cross-site GET mutations exist |
| Clickjacking | **Verified**: `frame-ancestors 'none'` + `X-Frame-Options: DENY` |
| Open redirect | **Verified**: `/auth/callback` only accepts `next` starting with `/` and not `//` |
| XSS | **Verified**: React escaping + strict CSP + no unsafe HTML |
| SSRF | **Verified**: the only server-side fetches are Supabase and the configured Upstash endpoint (env-controlled) |
| Secret exposure | **Verified**: none in repo/client bundle |
| PII in logs/URLs | **Verified**: order pages are `noindex`, tracking requires number+phone, no PII in query strings generated by the app |

## Not claimed
This document does **not** assert OWASP compliance. It records what was inspected and tested in
this environment, and what remains unverified (live CORS, monitoring, reset emails, CI permissions).

---

# Round 2 — additional evidence (browser + new tests)

Everything below was executed in this environment (Playwright Chromium 156, PGlite PostgreSQL,
Next dev server). Screenshots/traces from the runs were inspected on failure only.

## A01 Broken Access Control — strengthened
* **VERIFIED**: new test `privilege-escalation.test.js`
  * a customer cannot set `profiles.role = 'admin'` or clear `is_blacklisted` (value re-read as superuser);
  * a customer cannot edit another customer’s profile;
  * `UPDATE products / inventory` from a customer affects 0 rows (RLS hides them), value verified unchanged;
  * `INSERT audit_log` from a customer raises an RLS violation.
* **VERIFIED**: `storage.objects` INSERT as customer is now rejected after migration `000010`
  (previously enforced only by a Supabase platform default). Admin INSERT succeeds.
* **VERIFIED (browser)**: `/admin`, `/admin/orders`, `/admin/products`, `/admin/shipping` all redirect
  anonymous visitors to `/admin/login`; the demo admin can reach the dashboard.

## A04/A07 Authentication — limits
* **VERIFIED (code + suite)**: sign-in 10/10 min, sign-up 5/10 min, admin sign-in 6/10 min, checkout
  20/10 min per IP and 5/hour per hashed phone, tracking 12/min, newsletter 5/10 min.
* **NOT TESTED**: exhausting a limit from a real browser and observing the Retry guidance
  (limiters are in-process; the messages are user-facing Arabic strings).

## A06 Insecure Design — business logic
* **VERIFIED**: duplicate submission with the same idempotency key creates exactly one order and does
  not re-reserve stock (`a replayed key returns the original order…`, `place_order is idempotent…`).
* **VERIFIED**: a replayed key returns the **original** order even when the payload differs.
* **VERIFIED**: a failing line (unknown product) rolls back the whole order — 0 orders, 0 items and
  unchanged inventory (`a failed order leaves no partial order…`).
* **VERIFIED (browser)**: double-clicking “Confirm order” produces one confirmation and the next order
  number does not exist when tracked.

## A08 Integrity — checkout inputs
* **VERIFIED**: checkout validates on the server with Zod; the RPC recomputes prices; the confirmation
  page renders `items` returned by the RPC (not the `cartSnapshot`).

## A09 Logging
* **VERIFIED**: admin RPCs write `audit_log` rows (`Admin Operations…` test); failures log `[reevita] …`
  without payloads.
* **REMAINING GAP**: no external monitoring/alerting. `docs/RUNBOOK.md` lists the hook-up points.

## A10 Exceptional conditions — new evidence
* **VERIFIED**: empty cart → “Checkout unavailable”, no order created.
* **VERIFIED**: invalid phone → inline error, values preserved, no navigation.
* **VERIFIED**: unknown order number on `/track` → “لم نجد طلبًا مطابقًا” (no internal detail leaked).

## Header/CSP re-checked in the browser
CSP (nonce + `strict-dynamic`), HSTS, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy and
Permissions-Policy are present on rendered pages, not just `curl` responses.

---

# Round 3 — release-gate findings

## A01/A08 — Cross-customer disclosure through the idempotency key (FIXED)
* **Finding (High):** migration 000008 returned the stored order — name, phone, subtotal, total,
  items — to **any** caller presenting a valid key. Keys are random UUIDs, but a leaked key (shared
  device, log, screenshot) would have disclosed another customer’s order.
* **Fix:** migration `20261023000011_idempotency_owner_binding.sql` normalises the incoming phone
  **before** the lookup and returns a replay only when the phone matches the stored order, or when
  the authenticated session owns it (`auth.uid() = orders.user_id`). Otherwise it raises `FORBIDDEN`.
* **Evidence:** `an idempotency key never discloses an order to a different phone number` and
  `the same customer replays with a differently formatted phone number` → PASS (20/20 backend).

## A04/A07 — Auth cookie hardening (FIXED, with one residual)
* **Finding:** `@supabase/ssr` defaults are `httpOnly: false`, no `secure`, `maxAge` **400 days**.
* **What was true of this app:** the browser Supabase client (`src/lib/supabase/client.ts`) was
  **never imported anywhere** — every auth operation already runs server-side.
* **Fix:** deleted the unused browser client; server client + middleware now pass shared
  `cookieOptions` (`src/lib/supabase/cookie-options.ts`): `httpOnly: true`, `sameSite: 'lax'`,
  `secure` in production, `path: '/'`, `maxAge` 60 days.
* **Residual:** `httpOnly: true` is only correct while no browser Supabase client exists. The file
  comment and `docs/MONITORING.md` state this invariant; re-adding a browser client requires
  revisiting the flag.
* **Verification status:** typecheck/lint/build + 13/13 E2E (demo mode) pass. Cookie attributes
  against a **live** Supabase login — **NOT TESTED** (no project access).

## A06 — Rate limiting validated (code-level)
* **VERIFIED:** `tests/unit/rate-limit-local.test.ts` — limit enforcement, per-key isolation,
  window reset.
* **VERIFIED (mocked):** `tests/unit/rate-limit-upstash.test.ts` — shared counter blocks across
  instances, `INCR`+`EXPIRE` are sent with the bearer token, and a Redis outage **degrades to the
  local limiter** (logged) instead of failing open.
* **BLOCKED:** behaviour against a real Upstash database (no credentials).

## A09 — Monitoring
* **NOT CONFIGURED.** Plan, hooks, alert ideas and PII-scrubbing rules are in `docs/MONITORING.md`.

## A10 — Migration repeatability / exceptional conditions
* **VERIFIED:** `tests/backend/migration-repeatability.test.js` re-applies 000008–000011 twice and
  asserts a single `place_order` signature, the unique index, bucket limits and storage RLS.
* **VERIFIED:** 000009/000010 no longer abort a migration run when the storage tables are not owned
  by the migration role — they emit `WARNING` plus a verification hint instead.

## Still not verified
Live Supabase Auth/Storage/PostgREST, live cookie attributes, live Upstash, staging COD order,
monitoring — all **BLOCKED/NOT TESTED** (no credentials, no staging project access).
