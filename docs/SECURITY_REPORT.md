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

---

# Round 4 — adversarial review of the release candidates

Scope: migration `000011`, storage migrations `000009`/`000010`, the cookie change, and the release
ordering. Everything below was reasoned from the code and then **executed** against PostgreSQL
(PGlite) and Chromium; live Supabase remains BLOCKED.

## S1. Idempotency replay disclosed personal data (CONFIRMED VULNERABILITY, FIXED)

**Attack (rejected after 000012, successful before it).**

1. Obtain an idempotency key (it travels in the checkout form body; a screenshot of dev-tools, a
   shared device, or any future client-side log would expose it).
2. Call `POST /rest/v1/rpc/place_order` directly with the anon key, the stolen key and the victim’s
   phone number (phone numbers are semi-public: deliveries, WhatsApp, business cards).
3. Before 000012 the function answered with `customer_name`, `customer_phone`, `total` and the
   `items` array. The phone number was therefore treated as an authenticator — it is not one.

**Fix — `000012_replay_minimisation.sql`.** The replay is now split by *proven* identity only:

* `auth.uid() = orders.user_id` → full payload (authenticated owner).
* everyone else (anonymous, another customer, or the original guest in a new browser) → non-personal
  summary: `order_number`, `status`, `created_at`, `subtotal`, `shipping_fee`, `cod_fee`, `total`,
  `currency`. **No** name, phone, e-mail, address, `order_id` or items.
* Guests keep their full confirmation through the `httpOnly` `rv_last_order` cookie written by the
  request that created the order; the action never overwrites a richer cookie with a limited replay
  and never attaches this browser’s cart snapshot to somebody else’s order number.

**Answers to the review questions (code-level):**

| Question | Answer |
| --- | --- |
| Is the phone client-supplied? | **Yes.** `p_customer_phone` comes from the form; the DB validates the *format* only. |
| Can an unauthenticated caller retrieve an order with key + same phone? | **Before 000012: yes (full record). After 000012: only the non-personal summary.** |
| Does the replay expose name/phone/address/items/totals? | **After 000012:** no name/phone/address/items/internal id. Money totals are still returned (deliberate, low sensitivity) so the confirmation page can render. |
| Can key or details leak via logs/URLs/analytics/storage? | Key lives only in the server-action POST body and the `orders.idempotency_key` column (no index on it besides the unique index; never logged, never in a URL). Order details are not in any URL. `localStorage` holds only cart display data. Analytics: none installed. |
| Is guest vs authenticated ownership distinguished? | **Yes**, by `auth.uid()` only. No browser-supplied user id or role claim is read anywhere in the function. |

**Security guarantee (guest checkout):** an attacker needs the 122-bit key **and** gains only
“an order of value X exists under number Y”. They cannot read or modify customer data. They cannot
cancel, re-address or re-pay anything (no such RPC).

**Residual risk (accepted, documented):**

* A guest who clears cookies loses the rich confirmation view and must use `/track` (order number +
  phone). This is a deliberate privacy/UX trade-off in favour of not disclosing PII.
* An attacker holding the key learns order existence, status and totals. Eliminating that fully would
  break safe retries; it is bounded to non-personal data.
* The key is long-lived in the row (needed for retries). If a database dump leaks, keys leak — but a
  dump already contains the orders themselves.

## S2. Storage migrations could “succeed” without applying the control (FIXED at the gate)

* `000009`/`000010` now emit `WARNING` instead of aborting when the migration role does not own the
  storage tables. That keeps `db push` green — and that is exactly why a **separate executable gate**
  is required.
* `supabase/verification/release_security_checks.sql` raises an exception (non-zero exit with
  `ON_ERROR_STOP`) if the bucket limits, MIME list, `storage.objects` RLS, any of the 4 policies, the
  single hardened `place_order`, or public-table RLS are missing.
* **Proved both ways:** `tests/backend/release-checks.test.js` — passes on a correct database; fails
  when bucket limits, a MIME type, storage RLS, a policy, or the 000012 function body are removed.
* API-level storage authorisation (customer denied / admin allowed / MIME rejected / read / delete):
  `scripts/verify-storage-api.mjs` — **NOT TESTED** (needs staging credentials); its `BLOCKED` path
  was executed and exits non-zero.

## S3. Cookies and authentication

| Property | Evidence | Status |
| --- | --- | --- |
| `httpOnly` on Supabase auth cookies | `cookie-options.ts` + unit test spawning `NODE_ENV=production` | **VERIFIED** (library level) |
| `httpOnly` in a real browser | E2E asserts `rv_demo_user.httpOnly === true` | **VERIFIED** (demo session) |
| `secure` in production only | unit test: `true` in production, `false` in development | **VERIFIED** |
| `sameSite=lax` | unit test + E2E (`sameSite === "Lax"`) | **VERIFIED** |
| No browser code reads the Supabase session cookie | browser client deleted; only `document.cookie` use is the locale preference | **VERIFIED** (grep) |
| Session refresh | middleware calls `supabase.auth.getUser()` on every matched request | **PARTIALLY VERIFIED** (code only) |
| Login / logout / redirects | E2E: demo sign-in → `/account` → sign-out → `/` → `/account` redirects to login | **VERIFIED** (demo mode) |
| Live Supabase login, refresh, recovery e-mail | no project access | **BLOCKED** |

Residual: `httpOnly: true` is only safe while **all** Supabase usage stays server-side. The file
comment states this; re-introducing a browser client requires revisiting the flag.

## S4. Release ordering and rollout compatibility

| Combination | Result | Status |
| --- | --- | --- |
| DB with 000008–000012 + old frontend (no key) | works; `p_idempotency_key` defaults to `NULL`, no replay path | **VERIFIED** by SQL reasoning + call with 10 args in the suite |
| New frontend (sends key) + DB **before** 000008 | `function place_order(...) does not exist` → checkout error | **NOT TESTED** (would need a live DB); derived from the signature |
| 000008–000011 applied but **000012 not** | replay still unlocks on phone → the vulnerability of S1 is present | **VERIFIED** by `release-checks.test.js` (gate fails) |

Therefore: apply **through 000012** and run the gate before deploying. No step in the sequence is
destructive; the rollback for 000012 is re-applying 000011, which restores the weaker behaviour and
must only be used to unblock an emergency — re-run the gate afterwards.

---

# Round 5 — staging release gate attempt

## Environment verification (Step 1) — BLOCKED, nothing executed

| Check | Command | Result |
| --- | --- | --- |
| HEAD / branch | `git rev-parse --short HEAD`, `git status --short` | `d9f532b`, clean, `cline/xxmgawat` tracking `origin` |
| Supabase credentials | loop over `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `DATABASE_URL`, `SUPABASE_ACCESS_TOKEN`, `STAGING_*` | **all unset** |
| Secret files | `ls -a | grep '\.env'` | only `.env.example` |
| Linked project | `.supabase`, `supabase/.temp`, `~/.supabase` | none |
| Tooling | `command -v supabase / psql / pg_dump` | none installed |
| API session | `curl https://api.supabase.com/v1/projects` | **401** (no session) |

Conclusion: the target cannot be proven to be staging, so **no migration, deployment or data change
was performed**. Steps 2–5 are BLOCKED, not “skipped quietly”.

## What the release gate now enforces (built and executed locally)

`scripts/staging-gate.sh` performs: identity guards → dry-run plan → tool check → `pg_dump` schema+data
backup → read-only preflight (`supabase/verification/staging_preflight.sql`) → apply `000008…000012`
with `ON_ERROR_STOP` → `release_security_checks.sql` (fail-fast) → Storage API checks
(`scripts/verify-storage-api.mjs`, or an explicit BLOCKED line).

**Fail-closed evidence** (5 cases executed, no credentials used):

| Input | Exit | Message |
| --- | --- | --- |
| no env | 2 | confirmation token required |
| wrong token (`yes`) | 2 | confirmation token required |
| staging ref == production ref | 3 | refusing to continue |
| DB URL references another project | 4 | refusing to continue |
| valid identity, `psql` missing | 5 | stops **before** any connection |
| `--dry-run` | 0 | lists 000008→000012, modifies nothing |

Two runner defects were found by this matrix and fixed: `HOME` was required under `set -u`, and the
migration matcher used the ID as a filename prefix so `000008` never matched `20261023000008_*.sql`.

## Security properties: verified locally vs live

| Property | Local evidence | Live Supabase |
| --- | --- | --- |
| RLS on 15 public tables + `storage.objects` | PGlite (33/33) + release gate | **BLOCKED** |
| Cross-customer isolation | `rls.test.js`, `privilege-escalation.test.js` | **BLOCKED** |
| Replay minimisation (no PII to non-owners) | `replay-disclosure.test.js` (8 scenarios) | **BLOCKED** |
| Stock concurrency / rollback | `concurrency.test.js`, `idempotency.test.js` | **BLOCKED** |
| Storage policy semantics | PGlite policies + `release-checks.test.js` | **BLOCKED** (needs Storage API) |
| Bucket limits / MIME | SQL assertions | **BLOCKED** |
| Cookie attributes | unit test across envs + Chromium E2E | **BLOCKED** (live login) |
| Rate limiting | unit tests incl. Upstash mock + outage fallback | **BLOCKED** (no Redis) |
| Monitoring | — | **NOT CONFIGURED** |
| CI on GitHub | template parses; pipeline simulated | **NOT TESTED** |

No claim in this report extends beyond the local column.
