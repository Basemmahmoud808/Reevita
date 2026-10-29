import { expect, test } from "@playwright/test";

test("collection picker shows the selected item's exact name, size, price, and availability", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/collections/hair-care-duo-bundle");

  await expect(page.getByRole("heading", { name: "Hair Care Duo Bundle" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "REEVITA Shampoo Blueberry" })).toBeVisible();
  const selectedProductImage = page.getByRole("img", { name: "REEVITA Shampoo Blueberry — REEVITA" });
  await expect(selectedProductImage).toBeVisible();
  await expect.poll(() => selectedProductImage.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(page.locator(".collection-product-size")).toHaveText("300 مل");
  await expect(page.locator(".collection-product-price")).toContainText("EGP 220");
  await expect(page.getByRole("button", { name: "Temporarily out of stock" })).toBeDisabled();

  await page.locator(".collection-product-thumbnail").nth(1).click();
  await expect(page.getByRole("heading", { name: "REEVITA Hair Mist Ruby Musk" })).toBeVisible();
  await expect(page.locator(".collection-product-size")).toHaveText("100 مل");
  await expect(page.getByRole("button", { name: "Temporarily out of stock" })).toBeDisabled();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/collections/hair-care-duo-bundle");
  await expect(page.getByRole("heading", { name: "Hair Care Duo Bundle" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
