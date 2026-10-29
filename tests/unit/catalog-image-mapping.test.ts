import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { staticProducts } from "@/lib/catalog";

const expectedImages: Record<string, string> = {
  "shampoo-dove": "Gemini_Generated_Image_ozjt9ozjt9ozjt9o.jpg",
  "shampoo-blueberry": "Gemini_Generated_Image_echqdaechqdaechq.jpg",
  "body-lotion-queen": "Gemini_Generated_Image_gyp61agyp61agyp6.jpg",
  "body-lotion-ruby-musk": "Gemini_Generated_Image_odogaoodogaoodog.jpg",
  "body-lotion-sexy": "s.jpg",
  "body-butter-sexy": "Gemini_Generated_Image_yow1joyow1joyow1.jpg",
  "body-butter-queen": "Gemini_Generated_Image_bp52xsbp52xsbp52.jpg",
  "body-butter-ruby-musk": "Gemini_Generated_Image_x8eg2wx8eg2wx8eg.jpg",
  "body-splash-sexy": "Gemini_Generated_Image_z6nj55z6nj55z6nj.jpg",
  "body-splash-queen": "Gemini_Generated_Image_ko6hg2ko6hg2ko6h.jpg",
  "body-splash-ruby-musk": "Gemini_Generated_Image_rsfpt0rsfpt0rsfp.jpg",
  "hair-mist-sexy": "Gemini_Generated_Image_kj1ed5kj1ed5kj1e.jpg",
  "hair-mist-queen": "Gemini_Generated_Image_6q61gp6q61gp6q61.jpg",
  "hair-mist-ruby-musk": "Gemini_Generated_Image_b2l3jab2l3jab2l3.jpg",
};

test("static product images match the product packaging mapping", () => {
  for (const product of staticProducts) {
    const expected = expectedImages[product.slug];
    if (expected) {
      assert.equal(product.images[0]?.url.split("/").pop(), expected, product.slug);
      assert.equal(existsSync(`public/images/supplied/${expected}`), true, `${product.slug} image asset exists`);
    }
  }

  assert.equal(staticProducts.length, 24);
  assert.equal(staticProducts.find((product) => product.slug === "body-butter-sexy")?.size, "200 جم");
  assert.equal(staticProducts.find((product) => product.slug === "body-butter-sexy-100")?.size, "100 جم");
  assert.equal(staticProducts.find((product) => product.slug === "body-butter-sexy")?.price, 320);
  assert.equal(staticProducts.find((product) => product.slug === "body-butter-sexy-100")?.price, 200);
  assert.equal(staticProducts.find((product) => product.slug === "shower-gel-dove")?.nameEn, "REEVITA Shower Gel Dove");
});
