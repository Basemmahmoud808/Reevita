# REEVITA — Load & Stress Test Report

**Date:** 2026‑10‑28 · **Target:** local production build (`npm run build` + `next start`, `127.0.0.1:3200`)
**Tool:** `scripts/load-test.mjs` (Node 24 `fetch`, keep‑alive, fixed request budget per level)
**Raw results:** `docs/evidence/load-test-results.json`

---

## 1. Environment and constraints

| Item | Value |
|---|---|
| Host | single sandbox container, 4 vCPU / 6 GiB, shared with the test runner |
| App | Next.js 16.4.2 production server (24 routes) |
| Node | v24.22.1 |
| Backend in this run | **blocked** mode (no Supabase credentials in the sandbox) — catalogue pages render from the bundled catalogue, so these numbers measure the Next.js/runtime path, **not** Postgres latency |
| Test window | bounded: 5/10/25/50 concurrent users × 6 requests = 300 requests at the top level |
| Safety | localhost only (the script refuses non-local targets without `--allow-remote`), read-only GETs, no order submissions |

Traffic mix (weighted): home ×4, `/shop` ×3, `/shop?category=…&sort=price-asc` ×2, product page ×3,
collection ×1, `/checkout` render ×2, `/track` ×1, `/sitemap.xml` ×1.

Reproduce:

```bash
npm run build
PORT=3200 npm start &
node scripts/load-test.mjs --levels 5,10,25,50 --requests-per-user 6 \
  --json docs/evidence/load-test-results.json
```

---

## 2. Results

| Concurrent users | Requests | Throughput | Median | p95 | p99 | Max | Error rate | Status |
|---|---|---|---|---|---|---|---|---|
| 5 | 30 | 155.7 req/s | 32.0 ms | 42.6 ms | 42.8 ms | 42.8 ms | **0 %** | 100 % `200` |
| 10 | 60 | 159.6 req/s | 71.3 ms | 81.0 ms | 104.4 ms | 104.4 ms | **0 %** | 100 % `200` |
| 25 | 150 | 187.2 req/s | 139.2 ms | 162.3 ms | 164.0 ms | 164.2 ms | **0 %** | 100 % `200` |
| 50 | 300 | 200.3 req/s | 257.4 ms | 274.3 ms | 278.0 ms | 278.6 ms | **0 %** | 100 % `200` |

(Final run after the last production build; an earlier run produced 128.9 → 206.1 req/s with the
same shape. Both runs are within normal variance on shared CPU.)

Observations:

- No 5xx, no timeouts, no connection errors at any level; latency grows linearly with concurrency,
  the expected signature of one Node process on 4 shared vCPUs.
- Throughput still rises at 50 users (206 req/s), i.e. the process was **not** saturated inside the
  tested envelope; the practical limit was not found, so no capacity number above 50 users is claimed.
- Every response is server-rendered (`Cache-Control: no-store` because of the per-request CSP nonce
  and cookies), so a production CDN would raise static throughput considerably. That is a
  configuration decision, not a code fix.

---

## 3. Checkout and order creation under load

**Measured here:** checkout was exercised as a **page render** only. Submitting real orders at load
would either need a staging database (not available) or would write into the demo store, so it was
deliberately excluded from the HTTP ladder.

**Order-creation integrity verified instead:**

| Test | What it proves | Result |
|---|---|---|
| `tests/backend/concurrency.test.js` | two simultaneous buyers for the last unit → exactly 1 success, 1 `INSUFFICIENT_STOCK`, final stock `0/1` | PASS |
| `tests/backend/idempotency.test.js` | replay returns the same order with no extra rows/stock movement; different phone rejected; failed attempt releases the claim; new key creates a new order | 7/7 PASS |
| `tests/unit/demo-idempotency.test.ts` | the same semantics in the demo store used by the E2E suite | 4/4 PASS |
| `tests/backend/place-order.test.js` | price/shipping/total recomputation, stock rejection without leaking the count, quantity cap, duplicate-line aggregation | PASS |
| `tests/backend/order-state-machine.test.js` | illegal transitions rejected, restock on cancel/refusal, reservation finalised on delivery | PASS |

**Duplicate order count under a simulated retry:** 1 order, 1 order item, 1 inventory movement
(asserted). **Inventory correctness:** never negative, never oversold (schema `CHECK` + row locks +
tests).


---

## 4. Rate‑limit behaviour

- Unit tests prove the local limiter allows exactly N requests per window, blocks afterwards,
  reports a retry delay, and that keys are independent (`tests/unit/rate-limit-behaviour.test.ts`).
- The HTTP ladder stayed below every configured limit (checkout 5/10 min per IP and per phone,
  login 10/15 min, admin login 5/15 min, newsletter 5/10 min, tracking 12/min), so no throttling was
  triggered — the mix represents normal customer traffic, not abuse.
- With Upstash configured, counters move to Redis; without it they are per instance. The
  **distributed** path was not executed here (no Redis endpoint in the sandbox).

---

## 5. Staging plan to close the remaining gaps

Run on a staging Supabase project with production-like data (never production):

1. Seed a test product with `quantity_available = 5`; run 20 parallel `place_order` calls with
   distinct idempotency keys (via `pg` or PostgREST); assert exactly 5 succeed and
   `quantity_available = 0`, `quantity_reserved = 5`.
2. Repeat with a **single** idempotency key × 20 parallel calls; assert 1 order row and 1 stock
   movement.
3. Measure p50/p95/p99 of `place_order` and of `admin_get_orders` with
   `EXPLAIN (ANALYZE, BUFFERS)`; confirm `idx_orders_created_at` is used at 10k+ rows.
4. Run `scripts/load-test.mjs` behind the real CDN/proxy configuration and verify the client IP seen
   by the limiter matches the real client (temporary staging-only debug echo).
5. Enable Upstash and repeat §4 with 50+ concurrent users from two instances to confirm shared
   counters.
6. Optional: `k6`/Artillery soak run (30–60 min at 25 users) to spot memory growth in the Node
   process.

---

## 6. Limitations of this report

- Single container, shared CPU; numbers are **not** production capacity guarantees.
- Database latency was not in the measured path (blocked mode); PGlite timings are excluded because
  in-process WASM Postgres does not represent network/DB latency.
- No browser-level (LCP/INP) measurement: the Playwright suite is blocked in this sandbox (missing
  `libglib-2.0.so.0`; installing OS packages requires root).
- No denial-of-service testing was performed. Load stayed bounded and read-only.
