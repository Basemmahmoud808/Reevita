import assert from "node:assert/strict";
import test from "node:test";
import {
  demoOrders,
  demoPlaceOrder,
  demoResetIdempotency,
  demoGovernorates,
} from "@/lib/demo/store";
import { staticProducts } from "@/lib/catalog";

function place(key: string | null, quantity = 1, phone = "01012345678") {
  const governorate = demoGovernorates()[0]!;
  const product = staticProducts[0]!;
  return demoPlaceOrder({
    customerName: "سارة أحمد",
    customerPhone: phone,
    customerEmail: null,
    governorateId: governorate.id,
    city: "مدينة نصر",
    addressLine: "شارع رئيسي، عمارة 10",
    landmark: null,
    orderNotes: null,
    items: [{ product_id: product.id, quantity }],
    idempotencyKey: key,
  });
}

test("demo checkout replays the same order for a repeated idempotency key", () => {
  demoResetIdempotency();
  const before = demoOrders().length;
  const key = "11111111-2222-3333-4444-555555555555";

  const first = place(key);
  const second = place(key);

  assert.equal(second.orderNumber, first.orderNumber);
  assert.equal(second.replayed, true);
  assert.equal(demoOrders().length, before + 1, "replay must not append a second order");
});

test("demo checkout rejects a key reused by another phone number", () => {
  demoResetIdempotency();
  const key = "aaaaaaaa-2222-3333-4444-555555555555";
  place(key, 1, "01011111111");

  assert.throws(() => place(key, 1, "01099999999"), /ORDER_REJECTED/);
});

test("demo checkout enforces the per-item quantity cap and stock checks", () => {
  demoResetIdempotency();
  assert.throws(() => place(null, 11), /Maximum quantity per product is 10/);
  assert.throws(() => place(null, 0), /INVALID_ITEM/);
});

test("demo checkout without a key still creates new orders", () => {
  demoResetIdempotency();
  const before = demoOrders().length;
  place(null);
  place(null);
  assert.equal(demoOrders().length, before + 2);
});
