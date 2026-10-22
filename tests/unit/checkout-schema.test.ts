import assert from "node:assert/strict";
import test from "node:test";
import { demoGovernorates } from "@/lib/demo/store";
import { staticProducts } from "@/lib/catalog";
import { checkoutSchema } from "@/lib/validation";

test("checkoutSchema accepts real demo governorate and product ids", () => {
  const governorate = demoGovernorates()[0];
  const product = staticProducts[0];
  assert.ok(governorate);
  assert.ok(product);

  const result = checkoutSchema.safeParse({
    customerName: "سارة أحمد",
    customerPhone: "01012345678",
    customerEmail: "",
    governorateId: governorate.id,
    city: "مدينة نصر",
    addressLine: "شارع رئيسي، عمارة 10، شقة 4",
    landmark: "",
    orderNotes: "",
    items: [{ product_id: product.id, quantity: 1 }],
    terms: true,
  });

  assert.equal(result.success, true);
});

test("checkoutSchema rejects an empty governorate", () => {
  const product = staticProducts[0];
  assert.ok(product);

  const result = checkoutSchema.safeParse({
    customerName: "سارة أحمد",
    customerPhone: "01012345678",
    customerEmail: "",
    governorateId: "",
    city: "مدينة نصر",
    addressLine: "شارع رئيسي، عمارة 10، شقة 4",
    items: [{ product_id: product.id, quantity: 1 }],
    terms: true,
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.error.flatten().fieldErrors.governorateId?.[0], "اختاري المحافظة");
  }
});
