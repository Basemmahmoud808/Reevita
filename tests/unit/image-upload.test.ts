import assert from "node:assert/strict";
import test from "node:test";
import { validateProductImage } from "@/lib/security/image-upload";

function fileOf(bytes: number[], type: string, name = "upload.bin"): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00];
const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10];
const WEBP = [0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50];

test("validateProductImage accepts real JPEG, PNG and WebP signatures", async () => {
  const png = await validateProductImage(fileOf(PNG, "image/png"));
  assert.equal(png.ok, true);
  assert.equal(png.extension, "png");

  const jpeg = await validateProductImage(fileOf(JPEG, "image/jpeg"));
  assert.equal(jpeg.ok, true);
  assert.equal(jpeg.extension, "jpg");

  const webp = await validateProductImage(fileOf(WEBP, "image/webp"));
  assert.equal(webp.ok, true);
  assert.equal(webp.extension, "webp");
});

test("validateProductImage rejects HTML/SVG disguised as an image", async () => {
  const html = await validateProductImage(fileOf([0x3c, 0x68, 0x74, 0x6d, 0x6c], "image/jpeg", "x.jpg"));
  assert.equal(html.ok, false);

  const svg = await validateProductImage(fileOf([0x3c, 0x73, 0x76, 0x67], "image/svg+xml", "x.svg"));
  assert.equal(svg.ok, false);
});

test("validateProductImage rejects a MIME type that does not match the bytes", async () => {
  const mismatched = await validateProductImage(fileOf(PNG, "image/jpeg"));
  assert.equal(mismatched.ok, false);
});

test("validateProductImage rejects missing files and oversized uploads", async () => {
  assert.equal((await validateProductImage(null)).ok, false);

  const big = new File([new Uint8Array(6 * 1024 * 1024)], "big.png", { type: "image/png" });
  const result = await validateProductImage(big);
  assert.equal(result.ok, false);
  assert.match(result.error ?? "", /5/);
});
