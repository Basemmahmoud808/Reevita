# REEVITA — Order Flow & Business Integrity Audit

**Scope:** product → cart → checkout → server validation → order creation → inventory →
admin processing → status transitions → customer confirmation → notifications.
**Environment:** isolated PGlite database built from `supabase/migrations/*` plus the local
production build. No production database, customer record or third‑party service was touched.

---

## 1. Traced lifecycle (as implemented)

```
Browser cart (localStorage, display only)
  └─ /checkout  →  placeOrderAction (server action)
        ├─ clientIp()                    → rate limit (IP + hashed phone)
        ├─ checkoutSchema (Zod)          → field/shape validation, ≤20 lines, qty ≤10, terms
        └─ placeOrder()  ── RPC place_order(p_* , p_idempotency_key)
              ├─ idempotency claim (order_idempotency, unique key)   ← new
              ├─ phone normalise + validate (+201xxxxxxxxx)
              ├─ blacklist check (profiles.is_blacklisted by phone)
              ├─ governorate + shipping rate lookup (active only)
              ├─ items: shape → aggregate duplicates → caps → lock inventory (FOR UPDATE,
              │          ORDER BY product_id) → re-read price/active → deduct/reserve
              ├─ shipping = 0 if subtotal ≥ threshold else governorate cost (server rule)
              ├─ INSERT orders + order_items + order_status_history('new')
              └─ JSON summary {order_id, order_number, totals, currency, replayed}
        └─ Set-Cookie LAST_ORDER_COOKIE { orderNumber, phone }   (httpOnly, 30 min)
        └─ redirect /order/<orderNumber>
              └─ get_order_receipt(order_number, phone)  ← server-verified receipt (new)

Admin processing
  ├─ /admin/orders            → RPC admin_get_orders (is_admin() guard, filter/paginate)
  ├─ /admin/orders/[id]       → RLS-scoped select (admin policy)
  └─ admin_update_order_status(order, new_status, reason, carrier, tracking)
        ├─ is_admin() guard
        ├─ row lock (SELECT … FOR UPDATE)                    ← new
        ├─ status whitelist + length checks                  ← new
        ├─ UPDATE orders.status
        └─ trigger handle_order_status_transition()
              ├─ transition matrix (new→confirmed→packed→shipped→delivered/refused/returned)
              ├─ restock on cancelled/refused/returned (available +N, reserved −N)
              ├─ finalise reservation on delivered (reserved −N)
              └─ blacklist phone on refused (+ notes)
        └─ INSERT order_status_history
```

Notification stage: **no provider is wired**. `EMAIL_NOTIFICATIONS_ENABLED=false`,
`SMS_NOTIFICATIONS_ENABLED=false`; there are no Resend/Twilio/WhatsApp calls in `src/`.
No outbound confirmation is claimed anywhere beyond "we will contact you".

---

## 2. Findings per stage

### A. Order creation — validated server-side

| Control | Verified behaviour | Evidence |
|---|---|---|
| Name / city / address bounds | DB re-validates lengths (2–80, 2–80, 5–240) plus notes ≤500, landmark ≤120, email ≤254 | migration 000008; malformed payload tests |
| Egyptian phone | Web + DB both normalise to `+201xxxxxxxxx`; invalid numbers rejected before any DB write | `phone-validation.test.js`, `checkout-schema.test.ts` |
| Governorate/shipping | Only an active governorate **and** active rate are accepted; fee/threshold come from the DB row | `place_order` + `place-order.test.js` (free-shipping boundary at 1000 EGP) |
| Prices/totals | Client sends only `product_id` + `quantity`; unit price, line totals, subtotal, shipping and grand total are computed inside the RPC | `place-order.test.js` (700 + 50 = 750) |
| Client-supplied prices | No price field is accepted on any server boundary; the removed `cartSnapshot` was display-only and is now dropped entirely | `checkoutSchema` (no price key) |
| Stock re-check | `SELECT … FOR UPDATE` then `quantity_available < qty` → `INSUFFICIENT_STOCK` without disclosing the count | `place-order.test.js` |
| Atomicity | One PL/pgSQL function = one transaction; any `RAISE` rolls back order, items, history, inventory and the idempotency claim | "failed attempts must roll the claim back" test |
| DB errors ≠ success | Errors surface as `OrderError` codes and the UI shows an error banner; the RPC returns `success: true` only on commit | inspection + probe |

**Duplicate prevention (new).** See C‑02 in `SECURITY_FINDINGS.md`. Key lifecycle:

| Event | Behaviour |
|---|---|
| First submit | key claimed, order created, cookie + redirect |
| Double click / retry / back-and-resubmit | same key → stored order returned (`replayed: true`), **no** new order, **no** extra stock movement |
| Validation/stock failure | transaction rolls back → claim released → retry with the same key allowed |
| Different phone reusing a key | `ORDER_REJECTED` (no cross-customer disclosure) |
| Confirmed order | client rotates the key on the confirmation screen; next purchase gets a new key |
| No JS / no key | server derives `auto-<sha256>` from phone + address + items + 10-minute window |

### B. Inventory & concurrency

- `inventory.quantity_available CHECK (>= 0)` and `quantity_reserved CHECK (>= 0)` make negative
  stock impossible at the schema level.
- `place_order` locks every affected inventory row `FOR UPDATE` in deterministic product order,
  so the last unit cannot be sold twice and multi-product orders cannot deadlock.
- Restock on `cancelled`/`refused`/`returned` adds back `quantity_available` and reduces
  `quantity_reserved` with `GREATEST(0, …)`; the trigger only runs on real transitions and
  terminal states cannot transition again, so restock is idempotent by construction.
- Verified: two concurrent buyers of the last unit → exactly one success, one
  `INSUFFICIENT_STOCK`, final stock `0 available / 1 reserved`
  (`tests/backend/concurrency.test.js`).

**Limitation.** PGlite serialises statements, so this proves the logic and constraints but not
real Postgres lock contention. The staging plan in `LOAD_TEST_REPORT.md` §5 covers the required
re-run (real Postgres, N parallel `place_order` calls, assert
`SUM(order_items.quantity) ≤ initial_stock` and `quantity_available ≥ 0`).

### C. Admin order management

- Access: `requireAdmin()` in the dashboard layout + RLS `orders_admin_all` + `is_admin()` inside
  every admin RPC. Unauthenticated `/admin*` requests redirect to `/admin/login` (HTTP check).
- Data minimisation: order detail shows name, phone, address, items, totals — what a courier
  needs; no payment data exists (COD).
- Transition enforcement: the **database trigger** owns the matrix; the UI only offers legal
  options. Skipping stages (`new → delivered`) is rejected with `INVALID_STATUS_TRANSITION`.
- Concurrency: `admin_update_order_status` now locks the order row before reading the old status,
  so two admins cannot interleave into an impossible pair; target status and free-text fields are
  validated before the update.
- Audit trail: every transition writes `order_status_history` with actor and reason; inventory and
  shipping-rate changes write `audit_log` (`tests/backend/admin-operations.test.js`).
- Cancellation/restock retry: terminal states reject further transitions, so a repeated cancel
  cannot restock twice.

### D. Customer confirmation

- The page shows only what the backend returns for the (order number, phone) pair; address and
  email are never returned by `get_order_receipt`.
- Guests can re-open the page within the cookie lifetime and can always use `/track`.
- Nothing is displayed as "confirmed" without a committed database row (wrong phone →
  `found: false`).

### E. Notifications and delivery

- No email/SMS/WhatsApp integration exists in code; nothing is sent, so duplicate-notification
  and retry semantics cannot be asserted.
- The `ShippingProvider` interface is a type stub with no implementation and no caller; carrier
  and tracking number are entered manually by an admin and stored on the order.
- Before enabling notifications add: webhook signature verification, one idempotency key per
  order event, retry with backoff, and a "notification sent" audit record.

---

## 3. Customer/role matrix (verified outcomes)

| Action | Anonymous | Customer (own) | Customer (other) | Admin |
|---|---|---|---|---|
| Read active products / availability view | allow | allow | allow | allow |
| Read `inventory` rows | deny (0 rows) | deny (0 rows) | deny | allow |
| Create order via `place_order` | allow (guest COD) | allow | n/a | allow |
| Read `orders` / `order_items` | deny | allow own | deny | allow all |
| Read `profiles` | deny | allow own | deny | allow all |
| Change `role` / `is_blacklisted` | deny | deny | deny | allow |
| Insert/update products/collections | deny | deny | deny | allow |
| `admin_*` RPCs | deny (`FORBIDDEN`) | deny | deny | allow |
| Read `audit_log`, `order_idempotency` | deny | deny | deny | allow (audit) |
| Track order (number + phone) | allow | allow | allow if phone matches | allow |

All rows above are asserted in `tests/backend/rls.test.js`,
`tests/backend/privilege-escalation.test.js` and `tests/backend/idempotency.test.js`.

---

## 4. Collections and bundle integrity

Collections are merchandising groupings of real products by fragrance family
(`fragranceSlug`); there is **no bundle SKU, no bundle price and no "add collection to cart"**
action in the codebase. Consequently:

- The grid on `/collections/[slug]` and the cart reference the same `product_id` values from
  `getProductsByFragrance()`; no client-supplied collection membership exists.
- Each add-to-cart action adds one product at catalogue price; the DB reprices from
  `public.products` at checkout, so a manipulated collection page cannot change a price.
- If a bundle feature is added later it must be modelled server-side (bundle table + composition
  validation + server-computed bundle price) and tested the way `place_order` is.

---

## 5. Residual order-integrity risks

1. **Notification duplication** cannot be assessed until a provider exists.
2. **`quantity_reserved` reconciliation** is manual when an admin sets absolute stock.
3. **Refund / `payment_status` transitions** are not implemented (COD only); `delivered` sets
   `payment_status = 'paid'` only in the demo store, while the DB trigger does not touch it —
   confirm the intended accounting rule with the owner before launch.
4. **`orders.total` is not constrained** to `subtotal + shipping_fee + cod_fee − discount` by a
   `CHECK`; it is only produced by the RPC. Adding the constraint is recommended once the COD fee
   policy is final.


Verified: 1 order row, 1 item row and a single inventory movement after a replayed request.
