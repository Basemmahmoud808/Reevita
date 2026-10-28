import test from "node:test";
import assert from "node:assert/strict";
import { categories, featuredCollections, staticProducts } from "@/lib/catalog";

test("catalog exposes exactly six product categories", () => {
  assert.deepEqual(categories.map((category) => category.nameEn).sort(), [
    "Shampoo",
    "Body Lotion",
    "Body Butter",
    "Body Splash",
    "Hair Mist",
    "Shower Gel",
  ].sort());
});

test("every static product belongs to one known category", () => {
  const knownSlugs = new Set(categories.map((category) => category.slug));
  assert.equal(new Set(staticProducts.map((product) => product.id)).size, staticProducts.length);
  assert.ok(staticProducts.every((product) => knownSlugs.has(product.categorySlug)));
  assert.deepEqual(
    Object.fromEntries(categories.map((category) => [category.slug, staticProducts.filter((product) => product.categorySlug === category.slug).length])),
    { shampoo: 2, "body-lotion": 3, "body-butter": 3, "body-splash": 3, "hair-mist": 3, "shower-gel": 0 },
  );
});

test("featured bundles use stable product ids and verified catalog totals", () => {
  const productsById = new Map(staticProducts.map((product) => [product.id, product]));
  const bundles = new Map(featuredCollections.map((collection) => [collection.slug, collection]));

  const softGlow = bundles.get("soft-glow-bundle");
  assert.ok(softGlow);
  assert.equal(softGlow.productIds?.length, 9);
  assert.equal(softGlow.productIds?.every((id) => productsById.has(id)), true);
  assert.equal(softGlow.productIds?.reduce((total, id) => total + (productsById.get(id)?.price ?? 0), 0), 2460);

  const hairCare = bundles.get("hair-care-duo-bundle");
  assert.ok(hairCare);
  assert.deepEqual(hairCare.productIds?.map((id) => productsById.get(id)?.slug), ["shampoo-blueberry", "hair-mist-ruby-musk"]);
  assert.equal(hairCare.productIds?.reduce((total, id) => total + (productsById.get(id)?.price ?? 0), 0), 550);
});
