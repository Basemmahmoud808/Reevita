import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { staticProducts } from "@/lib/catalog";

test("static product images match the product packaging mapping", () => {
  for (const product of staticProducts) {
    const imageUrl = product.images[0]?.url;
    assert.ok(imageUrl, `${product.slug} must have an image`);
    assert.equal(existsSync(`public${imageUrl}`), true, `${product.slug} image asset exists on disk (${imageUrl})`);
  }

  assert.equal(staticProducts.length, 24);
  assert.equal(staticProducts.find((product) => product.slug === "body-butter-sexy")?.size, "200 جم");
  assert.equal(staticProducts.find((product) => product.slug === "body-butter-sexy-100")?.size, "100 جم");
  assert.equal(staticProducts.find((product) => product.slug === "body-butter-sexy")?.price, 320);
  assert.equal(staticProducts.find((product) => product.slug === "body-butter-sexy-100")?.price, 200);
  assert.equal(staticProducts.find((product) => product.slug === "shower-gel-dove")?.nameEn, "REEVITA Shower Gel");
});
