import assert from "node:assert/strict";
import test from "node:test";

/**
 * Fail-closed guard for misconfigured production deployments.
 *
 * Historically the data layer fell back to the in-memory demo store whenever
 * Supabase was not configured — including production. That silently accepted
 * real customer orders that were never persisted. The backend mode must now be
 * `blocked` in production and writes must be refused with a customer-safe error.
 */
process.env.NODE_ENV = "production";
delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function loadEnv() {
  return import("@/lib/env");
}

async function loadOrders() {
  return import("@/lib/data/orders");
}

const payload = {
  customerName: "سارة أحمد",
  customerPhone: "01012345678",
  customerEmail: null,
  governorateId: "11111111-0000-0000-0000-000000000001",
  city: "مدينة نصر",
  addressLine: "شارع رئيسي، عمارة 10",
  landmark: null,
  orderNotes: null,
  items: [{ product_id: "33333333-0000-0000-0000-000000000001", quantity: 1 }],
};

test("production without Supabase credentials is a blocked backend", async () => {
  const { backendMode } = await loadEnv();
  assert.equal(backendMode, "blocked");
});

test("order creation fails closed instead of writing to the demo store", async () => {
  const { placeOrder } = await loadOrders();
  await assert.rejects(
    () => placeOrder(payload, "203.0.113.10", "11111111-2222-3333-4444-555555555555"),
    /خدمة الطلبات غير متاحة|not available/i,
  );
});

test("tracking and receipt lookups do not serve demo fixtures in production", async () => {
  const { getOrderReceipt, trackOrder } = await loadOrders();
  const tracked = await trackOrder("RV-2026-10001", "01012345678");
  assert.equal(tracked.found, false);

  const receipt = await getOrderReceipt("RV-2026-10001", "01012345678");
  assert.equal(receipt, null);
});
