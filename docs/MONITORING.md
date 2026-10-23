# REEVITA — Monitoring & Alerting Plan

**Current state: NOT CONFIGURED.** No error-monitoring, log-drain or uptime service is wired into
this repository, and nothing in this document has been executed. The only signals today are
`console.error("[reevita] …")` calls (visible in Vercel runtime logs) and the `audit_log` table.

## 1. Existing hooks (VERIFIED)

| Hook | Location | Emits |
| --- | --- | --- |
| Route-level error boundary | `src/app/error.tsx` | `[reevita] unhandled error` + error object |
| Checkout failure | `src/lib/actions/checkout.ts` | `[reevita] checkout failed` |
| Tracking failure | `src/lib/actions/checkout.ts` | `[reevita] tracking failed` |
| Admin action failure | `src/lib/actions/admin.ts` (multiple) | `[reevita] … failed` |
| Rate-limit degradation | `src/lib/security/rate-limit.ts` | `[reevita] Upstash rate limit failed; using local fallback` |
| Data-layer failures | `src/lib/data/*.ts` | `[reevita] … query failed` |
| Business audit trail | `public.audit_log` (via admin RPCs) | actor, action, entity, details |

No secrets, passwords, tokens or full customer records are logged by these calls.

## 2. Recommended setup for the current host (Vercel + Next.js 16)

**Option A — Sentry (recommended):** captures server-action and client exceptions with stack traces
and release tagging.

```bash
# to be run by the owner, with a Sentry project + DSN
npx @sentry/wizard@latest -i nextjs
```

This adds `@sentry/nextjs`, `instrumentation.ts`/`instrumentation-client.ts`, and the env vars
`NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` (build-time source maps
only — **never** `NEXT_PUBLIC_`).

**Option B — Vercel Observability + Log Drain** (no code change): enable *Observability* and forward
runtime logs to Axiom/Datadog/BetterStack, then alert on the `[reevita]` prefixes above.

**Option C — uptime check** on `/` and `/shop` (any external monitor) to catch total outages.

## 3. Alerts to create (thresholds are proposals, not verified limits)

| Alert | Signal | Suggested threshold |
| --- | --- | --- |
| Checkout failures | `checkout failed` / `ORDER_ERROR_MESSAGES` codes | > 3 in 10 min |
| 5xx rate | Vercel function errors | > 2% of requests over 15 min |
| Admin action failures | `admin … failed` | any occurrence |
| Rate-limit fallback | `Upstash rate limit failed` | any occurrence (indicates Redis outage) |
| Inventory/order anomaly | `INSUFFICIENT_STOCK` spikes | > 10 in 1 h |
| Uptime | `/` and `/shop` | 2 consecutive failures |

## 4. PII / secret scrubbing (required before enabling a vendor)

* Never send `customer_phone`, `customer_name`, `shipping_address_snapshot` or auth tokens.
* Use Sentry `beforeSend` to drop `event.request.data` for `/checkout` and any header named
  `authorization`, `cookie`, `set-cookie`.
* Send `order_number` at most — never the full order payload.

## 5. How to verify it is really active (owner)

1. Deploy to **preview** with the DSN set.
2. Trigger a controlled server error (e.g. a temporary route that throws) on the preview URL.
3. Confirm the event appears in the vendor dashboard with the correct release/environment.
4. Confirm no PII appears in the event payload.

Until steps 1–4 are done, monitoring must be reported as **NOT CONFIGURED**.
