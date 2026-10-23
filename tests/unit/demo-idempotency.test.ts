import assert from "node:assert/strict";
import test from "node:test";
import { staticProducts } from "@/lib/catalog";
import { demoGovernorates, demoOrder, demoPlaceOrder } from "@/lib/demo/store";

function payload(idempotencyKey: string) {
  const governorate = demoGovernorates()[0]!;
  const product = staticProducts[0]!;
  return {
    customerName: "سارة أحمد",
    customerPhone: "01012345678",
    city: "مدينة نصر",
    addressLine: "شارع رئيسي، عمارة 10، شقة 4",
    governorateId: governorate.id,
    items: [{ product_id: product.id, quantity: 1 }],
    idempotencyKey,
  };
}

test("demoPlaceOrder replays the original order for a repeated idempotency key", () => {
  const key = `demo-key-${Date.now()}`;
  const first = demoPlaceOrder(payload(key));
  const second = demoPlaceOrder(payload(key));

  assert.equal(second.orderNumber, first.orderNumber);
  assert.equal(second.total, first.total);
  assert.ok(demoOrder(first.orderNumber), "original order is persisted once");
});

test("demoPlaceOrder creates distinct orders for distinct keys", () => {
  const first = demoPlaceOrder(payload(`demo-a-${Date.now()}`));
  const second = demoPlaceOrder(payload(`demo-b-${Date.now()}`));
  assert.notEqual(second.orderNumber, first.orderNumber);
});

test("demoPlaceOrder rejects an unsupported governorate", () => {
  assert.throws(
    () => demoPlaceOrder({ ...payload(`demo-bad-${Date.now()}`), governorateId: "00000000-0000-0000-0000-000000000000" }),
    /INVALID_LOCATION/,
  );
});
