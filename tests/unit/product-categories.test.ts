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
    { shampoo: 3, "body-lotion": 3, "body-butter": 6, "body-splash": 6, "hair-mist": 3, "shower-gel": 3 },
  );
});

test("featured bundle membership and totals match verified catalog data", () => {
  const productsById = new Map(staticProducts.map((product) => [product.id, product]));
  const bundles = new Map(featuredCollections.map((collection) => [collection.slug, collection]));

  const softGlow = bundles.get("soft-glow-bundle");
  assert.ok(softGlow);
  assert.equal(softGlow.productIds?.length, 6);
  assert.equal(softGlow.purchaseReady, true);
  assert.deepEqual(softGlow.missingProducts, []);

  const completeCare = bundles.get("complete-care-bundle");
  assert.ok(completeCare);
  assert.equal(completeCare.purchaseReady, true);
  assert.deepEqual(completeCare.missingProducts, []);
  assert.equal(completeCare.productIds?.length, 9);
  assert.equal(completeCare.productIds?.reduce((total, id) => total + (productsById.get(id)?.price ?? 0), 0), 2340);

  const hairCare = bundles.get("hair-care-duo-bundle");
  assert.ok(hairCare);
  assert.equal(featuredCollections.filter((collection) => collection.slug === "hair-care-duo-bundle").length, 1);
  assert.equal(hairCare.nameEn, "Hair Care Duo Bundle");
  assert.equal(hairCare.image, "/images/collections/hair-care-duo-products.jpg");
  assert.equal(hairCare.isPublished, true);
  assert.equal(hairCare.purchaseReady, true);
  assert.deepEqual(hairCare.productIds?.map((id) => productsById.get(id)?.slug), ["shampoo-blueberry", "hair-mist-ruby-musk"]);
  assert.equal(hairCare.productIds?.reduce((total, id) => total + (productsById.get(id)?.price ?? 0), 0), 440);
});
