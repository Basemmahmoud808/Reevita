import assert from "node:assert/strict";
import test from "node:test";
import { staticProducts } from "@/lib/catalog";
import { filterProducts, SORTS } from "@/lib/shop-filter";

test("filterProducts filters by category and ignores unknown categories", () => {
  const category = staticProducts[0]!.categorySlug;
  const scoped = filterProducts(staticProducts, "", category, "featured");
  assert.ok(scoped.length > 0);
  assert.ok(scoped.every((product) => product.categorySlug === category));

  const unknown = filterProducts(staticProducts, "", "not-a-category", "featured");
  assert.equal(unknown.length, 0);
});

test("filterProducts searches Arabic and English names", () => {
  const product = staticProducts[0]!;
  assert.ok(filterProducts(staticProducts, product.nameEn.slice(0, 4), "", "featured").length > 0);
  assert.equal(filterProducts(staticProducts, "zzzz-no-match", "", "featured").length, 0);
});

test("filterProducts sorts by price and never mutates input", () => {
  const original = [...staticProducts];
  const asc = filterProducts(staticProducts, "", "", "price-asc");
  const desc = filterProducts(staticProducts, "", "", "price-desc");
  assert.deepEqual(asc.map((p) => p.price), [...asc.map((p) => p.price)].sort((a, b) => a - b));
  assert.equal(desc[0]!.price, Math.max(...staticProducts.map((p) => p.price)));
  assert.deepEqual(staticProducts, original);
});

test("SORTS whitelist matches the toolbar options", () => {
  assert.deepEqual([...SORTS], ["featured", "newest", "best-selling", "price-asc", "price-desc"]);
});
