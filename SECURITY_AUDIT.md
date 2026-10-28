# REEVITA — Security & Production‑Readiness Audit

**Audit date:** 2026‑10‑28
**Repository:** `Basemmahmoud808/Reevita` · branch `cline/ad7k4cke`, base commit `bf20280`
**OWASP edition used:** **OWASP Top 10:2025** (verified against <https://owasp.org/Top10/2025/> on audit date)

> This is an engineering assessment, not a certification. It records what was inspected,
> what was executed, what was fixed and what remains open. It does **not** claim OWASP
> compliance, PCI compliance or "fully secure" status.

---

## 1. What the application actually is

| Layer | Implementation (verified in code) |
|---|---|
| Framework | Next.js **16.4.2** (App Router, Turbopack), React 19, TypeScript strict |
| Runtime / package manager | Node ≥ 20 (tested on Node 24), **npm** (`package-lock.json`) |
| Backend | Supabase / PostgreSQL: tables, RLS policies, `SECURITY DEFINER` RPCs, one public storage bucket |
| Auth | Supabase Auth (`@supabase/ssr`, cookie‑based, `getUser()` JWT re‑validation) + a **local demo mode** when Supabase env vars are absent outside production |
| Server entry points | Server Actions (`src/lib/actions/*`), one route handler (`/auth/callback`), `proxy.ts` (Next 16 middleware) for session refresh + CSP |
| Database objects | 7 original migrations + 1 added by this audit (`20261028000008…`): 17 tables, ~20 functions, 1 state‑machine trigger |
| Admin | `/admin/login`, `/admin`, orders, order detail, products, shipping; authorization via `requireAdmin()` + `is_admin()` in every RPC + RLS |
| Payments | Cash on delivery only (`payment_method = 'cod'`); online payments explicitly disabled |
| Notifications | None wired. `EMAIL_/SMS_NOTIFICATIONS_ENABLED`, `CAPTCHA_ENABLED` are `false` and unused in code |
| Tests | `tests/unit` (tsx + node:test), `tests/backend` (PGlite), `tests/e2e` (Playwright) |

### Baseline before any change (commit `bf20280`)

| Gate | Command | Result |
|---|---|---|
| Type check | `npm run typecheck` | **PASS** |
| Lint | `npm run lint` | **PASS** |
| Unit tests | `npm run test:unit` | **PASS** 3/3 |
| Backend tests | `npm run test:backend` | **PASS** 8/8 |
| Production build | `npm run build` | **PASS** — 17 routes |
| Dependency audit | `npm audit` | **0 vulnerabilities** (379 packages) |
| E2E | `npm run test:e2e` | **BLOCKED in sandbox** — Chromium cannot start (`libglib-2.0.so.0` missing; installing OS deps needs root). No result is claimed |

---

## 2. Method

1. Repository, migration and configuration inspection; traced product → cart → checkout →
   RPC → order → inventory → admin → confirmation.
2. Runtime probing on an **isolated PGlite database** built from the repo migrations, with
   dedicated fixture users — never against production.
3. HTTP probing against a **local production build** (`next start` on `127.0.0.1:3200`).
4. Fix → regression test → re‑test → neighbouring tests → full build.
5. Bounded load testing with `scripts/load-test.mjs` on the local build.

Safety rules observed: no production credentials, no real customer data, no password
guessing against real accounts, no destructive migrations, no paid/third‑party integration
calls, and no secret values are reproduced in these reports.


---

## 3. OWASP Top 10:2025 coverage

| # | Category (official 2025 name) | Reviewed | Outcome |
|---|---|---|---|
| A01 | Broken Access Control | yes | RLS + `is_admin()` verified by tests; **fixed** unprotected storefront routes and cookie‑trusted confirmation; admin routes redirect unauthenticated users (HTTP check) |
| A02 | Security Misconfiguration | yes | Headers/CSP verified; **fixed** production‑without‑backend fail‑open mode; documented `site_settings` public read and CSP `style-src` residual risk |
| A03 | Software Supply Chain Failures | yes | Lockfile consistent, `npm ci` reproducible, `npm audit` clean; **open** CI dependency review (no pipeline in repo) |
| A04 | Cryptographic Failures | yes | No custom crypto; Supabase TLS + signed JWT sessions; cookies `HttpOnly`/`SameSite=Lax`/`Secure` in production; rate‑limit keys SHA‑256 hashed (no PII in Redis) |
| A05 | Injection | yes | All DB access via Supabase client/RPC parameters; no concatenated SQL; no `dangerouslySetInnerHTML`; validation in Zod + DB checks; stock errors no longer echo internal state |
| A06 | Insecure Design | yes | **Fixed** missing checkout idempotency (duplicate orders), missing server‑side quantity/line caps, unbounded order payloads |
| A07 | Authentication Failures | yes | **Fixed** absent throttling on login/register/admin login and account enumeration in sign‑up errors; non‑admin admin login is signed out |
| A08 | Software or Data Integrity Failures | yes | **Fixed** confirmation page integrity (server‑verified receipt); totals computed only in DB; state machine + audit trail verified |
| A09 | Security Logging and Alerting Failures | partial | Server‑side `console.error` only; **open** (recommendation: structured logs, alerting on 429/5xx, audit dashboards) |
| A10 | Mishandling of Exceptional Conditions | yes | **Fixed** raw Postgres cast errors on malformed item payloads; DB errors mapped to domain codes; generic customer messages; fail‑closed backend mode |

Also consulted: OWASP **ASVS 4.0.3** (V2 auth, V4 access control, V5 validation, V7 error
handling/logging, V8 data protection, V9 communications, V14 configuration), **OWASP API
Security Top 10:2023** (API1 BOLA, API2 broken auth, API4 resource consumption, API6
business‑flow abuse, API8 misconfiguration) and the relevant OWASP cheat sheets
(Authorization, Input Validation, SQL‑Injection Prevention, Session Management, File Upload,
Rate Limiting, Error Handling).

---

## 4. Verification evidence (after remediation)

| Command | Result (audit date) |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run test:unit` | **25/25 PASS** (6 new files) |
| `npm run test:backend` | **21/21 PASS** (13 new tests: idempotency ×7, privilege escalation ×6) |
| `npm run build` | **PASS** — 24 routes |
| `node scripts/http-security-check.mjs` | **26/26 PASS** (headers, CSP nonce, admin/account protection, 404, 29/29 sitemap URLs resolve, cache headers) |
| `node scripts/load-test.mjs --levels 5,10,25,50` | 0 % errors up to 50 concurrent users (see `LOAD_TEST_REPORT.md`) |
| `npm audit` | 0 vulnerabilities |
| `npm run test:e2e` | **BLOCKED (environment)** — no result claimed |

Artifacts: `docs/evidence/load-test-results.json`, `SECURITY_FINDINGS.md`,
`ORDER_FLOW_AUDIT.md`, `LOAD_TEST_REPORT.md`, `REMEDIATION_LOG.md`.

---

## 5. Residual risk and blockers (not fixed here)

1. **Distributed rate limiting needs infrastructure.** Counters are in‑process unless
   `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are set. On multi‑instance
   hosting, limits are per instance until Upstash is configured — owner action required.
2. **No staging Supabase project was available.** Fixes were verified against PGlite
   (schema/RLS/RPC semantics) and a local production build. Row‑lock behaviour under real
   concurrent Postgres connections must be re‑run on staging.
3. **Browser E2E cannot execute in this sandbox** (missing OS libraries). The suite is
   retained; CI should run `npx playwright install --with-deps chromium` first.
4. **No logging/alerting pipeline** (A09). `console.error` is the only signal today.
5. **`site_settings` is publicly readable** (all keys). It only holds marketing config today;
   adding secrets/operational values there would leak them.
6. **CSP keeps `style-src 'unsafe-inline'`** for Tailwind/inline styles. Scripts use a
   per‑response nonce with `strict-dynamic`; style‑based injection remains a low residual risk.
7. **Legal/policy pages are not implemented.** `/about` and `/policies/*` were removed from
   the sitemap instead of fabricating legal copy; owner‑approved texts are still required.
8. **No online payment path exists** (COD only by design). If enabled later, the
   `PaymentProvider` interface, webhook signature verification and PCI scope must be audited.
