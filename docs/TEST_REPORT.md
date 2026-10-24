# REEVITA — Test Report

Date: 2026-10-23 · Branch: `cline/xxmgawat` · Node 20+ · Next 16.4.2
All commands below were actually executed in this environment unless marked **Blocked**.

## 1. Static checks

| Command | Expected | Actual | Status |
| --- | --- | --- | --- |
| `npm run typecheck` (`next typegen && tsc --noEmit`) | 0 errors | 0 errors | PASS |
| `npm run lint` (`eslint .`) | 0 errors/warnings | 0 | PASS |
| `npm run build` (`next build`) | successful production build | 21 routes compiled | PASS |
| `npm audit --omit=dev` | no high/critical | `found 0 vulnerabilities` | PASS |

## 2. Unit tests — `npm run test:unit` (tsx --test)

| Case | Status |
| --- | --- |
| static product images match the packaging mapping | PASS |
| checkoutSchema accepts real demo governorate and product ids | PASS |
| checkoutSchema rejects an empty governorate | PASS |
| **new** filterProducts filters by category and ignores unknown categories | PASS |
| **new** filterProducts searches Arabic and English names | PASS |
| **new** filterProducts sorts by price and never mutates input | PASS |
| **new** SORTS whitelist matches the toolbar options | PASS |

Result: `tests 7 · pass 7 · fail 0`.

## 3. Backend integration tests — `npm run test:backend` (PGlite, real migrations)

Each suite builds a fresh database by applying **all** migrations in order, then the seed file.

| Case | Status |
| --- | --- |
| Admin Operations: order listing, KPI metrics, inventory updates, audit logging | PASS |
| Concurrency: only 1 order succeeds for the last remaining unit | PASS |
| Database migrations and seed apply cleanly from scratch | PASS |
| Order state machine, inventory auto-restoration, secure tracking | PASS |
| normalize_egyptian_phone validates and formats correctly | PASS |
| place_order calculates subtotal, shipping, updates inventory | PASS |
| RLS enforcement: visitor, customer, admin | PASS |
| Storefront seed & migration 000006: 14 SKUs, availability view, profile provisioning | PASS |
| **new** place_order is idempotent for a repeated submission key | PASS |
| **new** place_order returns server-validated items and prices | PASS |
| **new** product-images bucket restricts size and MIME types | PASS |

Result: `tests 11 · pass 11 · fail 0` (≈10 s).

Notes:
* PGlite is Postgres, not Supabase. Supabase-managed objects (`auth.users`, `storage.*`, `auth.uid()`)
  are shimmed by `tests/backend/setup-db.js`; behaviour verified here is SQL-level. Anything that depends
  on the GoTrue/PostgREST layer (JWT handling, Storage API) is **Not tested** in this environment.
* Migration `000008` drops the 10-argument `place_order` and recreates it with an 11th defaulted argument;
  the whole suite passing proves the drop/recreate is consistent with all existing callers.

## 4. HTTP verification of the storefront (dev server, demo mode)

Server: `npm run dev -- --hostname 127.0.0.1 --port 3100`, requests via `curl` with the sandbox proxy bypassed.

| Route | Expected | Actual | Status |
| --- | --- | --- | --- |
| `/` | 200 | 200 | PASS |
| `/shop` | 200, 14 product cards | 200, 14 `<article>` | PASS |
| `/shop?category=shampoo` | 2 cards | 2 | PASS |
| `/shop?search=zzzz` | empty state text | «لا توجد منتجات مطابقة لبحثك.» | PASS |
| `/products/body-lotion-sexy` | 200 | 200 | PASS |
| `/checkout` | 200 | 200 | PASS |
| `/track` | 200 + form | 200, h1 «تتبّع طلبك» | PASS |
| `/faq`, `/contact`, `/about` | 200 | 200 | PASS |
| `/account` | redirect | 307 → `/account/login` | PASS |
| `/admin` | redirect | 307 → `/admin/login` | PASS |
| `/collections`, `/collections/sexy` | redirect to shop | 200 after redirect | PASS |
| `/sitemap.xml` | no dead URLs | only existing routes | PASS |
| `/nonexistent` | 404 | 404 | PASS |
| Security headers on `/shop` | CSP/HSTS/XFO/nosniff/PP | all present (nonce CSP) | PASS |

## 5. End-to-end (Playwright)

Command: `npm run test:e2e`.

**Status: BLOCKED in this sandbox.**
* `npx playwright install chromium` downloaded Chrome Headless Shell 156 successfully.
* Launch fails: `chrome-headless-shell: error while loading shared libraries: libglib-2.0.so.0`.
* `npx playwright install-deps chromium` requires root (`su: Authentication failure`; no sudo).

The suite (`tests/e2e/checkout.spec.ts`, `tests/e2e/storefront.spec.ts`) is committed and must be run
in CI or on a workstation with browser dependencies:

```bash
npx playwright install --with-deps chromium
npm run test:e2e
```

Scenarios covered by the committed specs (execution **Not tested** here):
1. Homepage loads and its CTA opens `/shop`.
2. `/shop` lists products, filters by category, shows the empty state.
3. Unknown product slug → Arabic 404.
4. `/track?order=…` pre-fills the tracking form.
5. `/account` and `/admin` redirect anonymous visitors to login.
6. No horizontal overflow at 360 px on `/`, `/shop`, `/checkout`.
7. Valid COD checkout redirects to `/order/RV-…` (pre-existing spec).
8. Invalid phone keeps the typed values and shows the error (pre-existing spec).

## 6. Security checks

| Check | Method | Result |
| --- | --- | --- |
| Secret scan (`eyJhbGciOi`, `service_role`) | grep over tracked files | no secrets; only docs/tests |
| RLS coverage | grep over migrations | 15/15 tables have RLS enabled |
| Auth redirects | curl | `/account`, `/admin` → login |
| CSP/headers | curl `-D` | present |
| Cross-customer order access | RLS test (`rls.test.js`) | denied |
| Stock race | `concurrency.test.js` | one winner |
| Duplicate order | `idempotency.test.js` | one order, stock unchanged |
| Upload limits | `admin-operations.test.js` | bucket limited to 5 MB / 3 MIME types |
| Dependency audit | `npm audit --omit=dev` | 0 vulnerabilities |

## 7. Not tested / blocked

* Live Supabase project behaviour (Auth, Storage API, PostgREST) — **Blocked**: no credentials.
* Playwright browser execution — **Blocked**: missing OS libraries, no root.
* Rate-limit exhaustion (7 failed admin logins) — **Not tested** (limiter is in-process; would need a driven UI).
* Password reset / email verification emails — **Blocked**: no mailbox.
* Deployment, domain, TLS, preview isolation — **Not tested**: no Vercel access.

---

# Round 2 — results after E2E became executable

## Environment
Playwright Chromium **now runs in this sandbox** without root. Two supported setups:

1. Normal machine / CI runner: `npx playwright install --with-deps chromium`.
2. Rootless container: `eval "$(python3 scripts/e2e_bootstrap.py --print-env)"` then
   `npx playwright install chromium`.

Root cause of the earlier block: missing `libglib-2.0.so.0` **and** no fontconfig-visible font — Skia
aborted with `SkFontMgr_FontConfigInterface.cpp:163 Not implemented`, which surfaced as
“Target page, context or browser has been closed”. Both are fixed by the bootstrap script.

## Commands and results

| Command | Result | Status |
| --- | --- | --- |
| `npm run typecheck` | 0 errors | PASS |
| `npm run lint` | 0 errors, 0 warnings | PASS |
| `npm run test:unit` | 10/10 | PASS |
| `npm run test:backend` | 17/17 | PASS |
| `npm run test:e2e` | 13/13 (twice consecutively) | PASS |
| `npm run build` | success, 26 routes | PASS |
| `npm audit --omit=dev` | 0 vulnerabilities | PASS |

## Unit tests (10)
Existing 3 (image mapping, checkout schema accepted/rejected) plus:
* `filterProducts` category filter + unknown category
* `filterProducts` Arabic/English search + empty result
* `filterProducts` price sort, no input mutation
* `SORTS` whitelist
* demo idempotency replay, distinct keys, unsupported governorate

## Backend tests (17)
Existing 8 plus:
* idempotent replay (one order, stock unchanged)
* server-validated items and prices
* failed order leaves no partial order/items/stock
* replayed key returns original order for a changed payload
* invalid idempotency key is ignored, not blocking
* bucket size + MIME limits
* customer cannot escalate role / unblacklist / edit others
* customer cannot modify products, inventory, audit log
* storage objects: admin-only writes

## E2E tests (13)
`tests/e2e/checkout.spec.ts` (2): valid COD checkout redirects to confirmation; invalid phone keeps
values.
`tests/e2e/storefront.spec.ts` (6): homepage → shop; shop listing/filter/empty state; unknown slug 404;
track form prefill; account+admin redirects; no horizontal overflow at 360 px on `/`, `/shop`,
`/checkout`.
`tests/e2e/cart-and-admin.spec.ts` (5): cart add/quantity/remove; empty cart cannot checkout;
double submit creates no second order (verified via tracking the next number); demo admin dashboard;
anonymous admin sub-pages redirect.

## Still not tested / blocked
* Live Supabase project (Auth, Storage API, PostgREST) — **BLOCKED** (no credentials).
* Rate-limit exhaustion UI behaviour — **NOT TESTED**.
* Password reset / verification e-mails — **BLOCKED** (no mailbox).
* Deployment, domain, preview isolation, monitoring — **NOT TESTED** (no provider access).
* CI workflow itself has not been executed on GitHub — **NOT TESTED** (written and reviewed only).

## CI status
`.github/workflows/ci.yml` could **not** be pushed from this environment: the GitHub App token
does not have the `workflows` permission (`refusing to allow a GitHub App to create or update
workflow .github/workflows/ci.yml without workflows permission`). The exact workflow is committed as
`docs/CI_WORKFLOW_TEMPLATE.yml`; the owner must copy it to `.github/workflows/ci.yml` (or push with a
token that has `workflows` scope).

```bash
mkdir -p .github/workflows && cp docs/CI_WORKFLOW_TEMPLATE.yml .github/workflows/ci.yml
git add .github/workflows/ci.yml && git commit -m "ci: add pipeline" && git push
```

The workflow has **not** been executed on GitHub — NOT TESTED.

---

# Round 3 — release-gate validation

## Local automated tests (all executed in this environment)

| Command | Result | Status |
| --- | --- | --- |
| `npm run typecheck` | 0 errors | PASS |
| `npm run lint` | 0 problems | PASS |
| `npm run test:unit` | **15/15** | PASS |
| `npm run test:backend` | **20/20** | PASS |
| `npm run test:e2e` | **13/13** (re-run after cookie change) | PASS |
| `npm run build` | success | PASS |
| `npm audit --omit=dev` | 0 vulnerabilities | PASS |
| CI pipeline simulation (`typecheck → lint → unit → backend → build`) | `== ALL GREEN` | PASS |
| `docs/CI_WORKFLOW_TEMPLATE.yml` YAML parse (`js-yaml`) | jobs `verify`, `e2e` | PASS |

New this round: rate-limit local (3), rate-limit Upstash/fallback (2), idempotency owner binding (2),
migration repeatability (1).

## Staging integration tests

**BLOCKED** — no Supabase credentials or staging project are available in this environment.
Prepared instead: `docs/STAGING_MIGRATION_PLAN.md` with applied-state queries, apply order,
verification SQL, an 11-row functional matrix, rollback per migration and a checklist.

## Production verification

**NOT TESTED.** No deployment, no domain/HTTPS check, no monitoring, no real COD order.

## Owner approvals still required

1. Apply `000008` → `000011` to staging (then production) with a backup.
2. Run the §6 functional matrix with synthetic data.
3. Approval of the cookie change against a live login (httpOnly depends on keeping auth server-side).
4. Set Upstash credentials to enable the distributed limiter.
5. Legal approval of `/policies/*` (`docs/POLICY_REVIEW.md`).
6. Enable monitoring (`docs/MONITORING.md`) and install the CI workflow.

---

# Round 4 — adversarial test results

## Local automated tests (executed)

| Command | Result | Status |
| --- | --- | --- |
| `npm run typecheck` | 0 errors | PASS |
| `npm run lint` | 0 problems | PASS |
| `npm run test:unit` | **17/17** | PASS |
| `npm run test:backend` | **33/33** | PASS |
| `npm run test:e2e` | **14/14** | PASS |
| `npm run build` | success | PASS |
| `node scripts/verify-storage-api.mjs` (no creds) | prints `BLOCKED`, exit 1 | PASS (expected) |

New this round:

* `tests/backend/replay-disclosure.test.js` — 8 adversarial scenarios: owner full replay; different
  phone; **same phone unauthenticated**; anonymous; another authenticated customer; 5 repeated
  retries (one order, one unit of stock); payload/log leakage scan; owner resolved from `auth.uid()`.
* `tests/backend/release-checks.test.js` — 6 tests: the release gate passes on a clean database and
  fails when bucket limits, a MIME type, storage RLS, a policy, or the hardened `place_order` body
  are missing.
* `tests/unit/cookie-options.test.ts` — httpOnly/sameSite/path/maxAge in dev+prod, `secure` production only.
* `tests/e2e/account.spec.ts` — demo sign-in → account → `httpOnly` cookie assertion → sign-out → redirect.

## Staging integration tests

**BLOCKED** — no Supabase credentials. Ready to run: `supabase/verification/release_security_checks.sql`
and `scripts/verify-storage-api.mjs` (both documented in `docs/STAGING_MIGRATION_PLAN.md` §9).

## Production verification

**NOT TESTED.** No deployment, no live cookie inspection, no live RLS/Storage checks, no real COD order.

---

# Round 5 — staging gate run

## Executed in this environment

| Check | Result | Status |
| --- | --- |
| Git state | `d9f532b`, clean tree | VERIFIED |
| Credentials present | none of the required variables set | FAILED (prerequisite) |
| Staging gate guards (5 unsafe inputs) | refused with codes 2/3/4/5; dry-run 0 | VERIFIED |
| `npm run test:backend` (with 000012 added to repeatability) | **33/33** | PASS |
| `npm run test:unit` | **17/17** | PASS |
| `npm run test:e2e` | **14/14** | PASS |
| `npm run verify` | exit 0 | PASS |

## Not executed (BLOCKED)

| Step | Reason |
| --- | --- |
| Apply 000008–000012 to staging | no credentials/authorization; target cannot be proven staging |
| `release_security_checks.sql` on live staging | same |
| Real anon/customer/admin authorization tests | same |
| Staging COD checkout, concurrency, rollback on live DB | same |
| Live login/session/logout/recovery | same |
| Upstash distributed limits | no Redis credentials |
| Production verification | out of scope by instruction |

## Exact owner command sequence

See `docs/STAGING_MIGRATION_PLAN.md` §11 (`npm run gate:staging -- --dry-run`, then
`npm run gate:staging`, then `npm run verify:storage`).
