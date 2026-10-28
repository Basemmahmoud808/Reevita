import { expect, test } from "@playwright/test";

test("Hair Care Duo shows its two products, total, and prevents accidental double add", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/collections/hair-care-duo-bundle");

  await expect(page.getByRole("heading", { name: "Hair Care Duo Bundle" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Hair Care Duo Bundle — صورة المجموعة" })).toHaveAttribute(
    "src",
    /hair-care-duo-bundle\.jpg/,
  );
  await expect(page.locator('a[href="/products/shampoo-blueberry"]')).toHaveCount(1);
  await expect(page.locator('a[href="/products/hair-mist-ruby-musk"]')).toHaveCount(1);
  await expect(page.getByText("EGP 550")).toBeVisible();

  await page.getByRole("button", { name: "Add Collection to Bag" }).dblclick();
  await expect(page.getByRole("button", { name: /سلة المشتريات — 2 منتج/ })).toBeVisible();
  await page.getByRole("button", { name: /سلة المشتريات — 2 منتج/ }).click();
  const cart = page.getByRole("dialog", { name: "Shopping bag" });
  await expect(cart).toBeVisible();
  await expect(cart.getByText("(2)")).toBeVisible();
  await expect(cart.getByText("EGP 550")).toBeVisible();
  await expect(cart.locator('a[href="/products/shampoo-blueberry"]')).toHaveCount(2);
  await expect(cart.locator('a[href="/products/hair-mist-ruby-musk"]')).toHaveCount(2);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/collections/hair-care-duo-bundle");
  await expect(page.getByRole("heading", { name: "Hair Care Duo Bundle" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
