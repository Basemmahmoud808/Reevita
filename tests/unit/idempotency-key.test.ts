import assert from "node:assert/strict";
import test from "node:test";
import { deriveIdempotencyKey, normalizeIdempotencyKey } from "@/lib/orders/idempotency";
import type { CheckoutPayload } from "@/lib/types";

const basePayload: CheckoutPayload = {
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

test("normalizeIdempotencyKey accepts client UUIDs and rejects malformed values", () => {
  assert.equal(
    normalizeIdempotencyKey(" 7f0f3f4e-6f7a-4a1c-9d0e-1a2b3c4d5e6f "),
    "7f0f3f4e-6f7a-4a1c-9d0e-1a2b3c4d5e6f",
  );
  assert.equal(normalizeIdempotencyKey(""), null);
  assert.equal(normalizeIdempotencyKey(undefined), null);
  assert.equal(normalizeIdempotencyKey("short"), null);
  assert.equal(normalizeIdempotencyKey("invalid key with spaces"), null);
  assert.equal(normalizeIdempotencyKey("x".repeat(200)), null);
});

test("deriveIdempotencyKey is stable for identical attempts inside the same window", () => {
  const now = 1_700_000_000_000;
  const first = deriveIdempotencyKey(basePayload, now);
  const second = deriveIdempotencyKey({ ...basePayload, customerPhone: "010 123 45678" }, now + 1_000);
  assert.equal(first, second, "formatting differences in the phone must not create a new key");
  assert.match(first, /^auto-[0-9a-f]{40}$/);
});

test("deriveIdempotencyKey changes with the time window, items or address", () => {
  const now = 1_700_000_000_000;
  const base = deriveIdempotencyKey(basePayload, now);

  assert.notEqual(base, deriveIdempotencyKey(basePayload, now + 11 * 60 * 1000), "a later window is a new purchase");
  assert.notEqual(
    base,
    deriveIdempotencyKey(
      { ...basePayload, items: [{ product_id: basePayload.items[0]!.product_id, quantity: 2 }] },
      now,
    ),
  );
  assert.notEqual(
    base,
    deriveIdempotencyKey({ ...basePayload, addressLine: "شارع آخر، عمارة 3" }, now),
  );
});

test("deriveIdempotencyKey never contains the phone number in clear", () => {
  const key = deriveIdempotencyKey(basePayload);
  assert.ok(!key.includes("01012345678"));
  assert.ok(!key.includes("+201012345678"));
});
