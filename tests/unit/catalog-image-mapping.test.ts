import assert from "node:assert/strict";
import test from "node:test";
import { staticProducts } from "@/lib/catalog";

const expectedImages: Record<string, string> = {
  "shampoo-dove": "Gemini_Generated_Image_ozjt9ozjt9ozjt9o.jfif",
  "shampoo-blueberry": "Gemini_Generated_Image_echqdaechqdaechq.jfif",
  "body-lotion-queen": "Gemini_Generated_Image_gyp61agyp61agyp6.jfif",
  "body-lotion-ruby-musk": "Gemini_Generated_Image_odogaoodogaoodog.jfif",
  "body-lotion-sexy": "s.jfif",
  "body-butter-sexy": "Gemini_Generated_Image_yow1joyow1joyow1.jfif",
  "body-butter-queen": "Gemini_Generated_Image_bp52xsbp52xsbp52.jfif",
  "body-butter-ruby-musk": "Gemini_Generated_Image_x8eg2wx8eg2wx8eg.jfif",
  "body-splash-sexy": "Gemini_Generated_Image_z6nj55z6nj55z6nj.jfif",
  "body-splash-queen": "Gemini_Generated_Image_ko6hg2ko6hg2ko6h.jfif",
  "body-splash-ruby-musk": "Gemini_Generated_Image_rsfpt0rsfpt0rsfp.jfif",
  "hair-mist-sexy": "Gemini_Generated_Image_kj1ed5kj1ed5kj1e.jfif",
  "hair-mist-queen": "Gemini_Generated_Image_6q61gp6q61gp6q61.jfif",
  "hair-mist-ruby-musk": "Gemini_Generated_Image_b2l3jab2l3jab2l3.jfif",
};

test("static product images match the product packaging mapping", () => {
  for (const product of staticProducts) {
    const expected = expectedImages[product.slug];
    if (expected) assert.equal(product.images[0]?.url.split("/").pop(), expected, product.slug);
  }

  assert.equal(staticProducts.length, 24);
  assert.equal(staticProducts.find((product) => product.slug === "body-butter-sexy")?.size, "200 جم");
  assert.equal(staticProducts.find((product) => product.slug === "body-butter-sexy-100")?.size, "100 جم");
  assert.equal(staticProducts.find((product) => product.slug === "body-butter-sexy")?.price, 320);
  assert.equal(staticProducts.find((product) => product.slug === "body-butter-sexy-100")?.price, 200);
  assert.equal(staticProducts.find((product) => product.slug === "shower-gel-dove")?.nameEn, "REEVITA Shower Gel Dove");
});
