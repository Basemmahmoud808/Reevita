import { expect, test } from "@playwright/test";

test("homepage renders and its primary CTA opens the shop", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/REEVITA/i);
  await page.getByRole("link", { name: /تسوّقي الآن|Shop now/i }).first().click();
  await expect(page).toHaveURL(/\/shop$/);
  await expect(page.getByRole("heading", { name: "المتجر" })).toBeVisible();
});

test("shop lists products, filters by category and handles empty results", async ({ page }) => {
  await page.goto("/shop");
  await expect(page.locator("article")).toHaveCount(14);

  await page.goto("/shop?category=shampoo");
  await expect(page.locator("article")).toHaveCount(2);

  await page.goto("/shop?search=zzzz-no-such-product");
  await expect(page.getByText("لا توجد منتجات مطابقة لبحثك.")).toBeVisible();
});

test("unknown product slug returns the Arabic 404 page", async ({ page }) => {
  const response = await page.goto("/products/does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "الصفحة غير موجودة" })).toBeVisible();
});

test("order tracking page renders its form", async ({ page }) => {
  await page.goto("/track?order=RV-2026-10001");
  await expect(page.getByRole("heading", { name: "تتبّع طلبك" })).toBeVisible();
  await expect(page.getByLabel("رقم الطلب")).toHaveValue("RV-2026-10001");
});

test("account and admin areas redirect anonymous visitors to login", async ({ page }) => {
  await page.goto("/account");
  await expect(page).toHaveURL(/\/account\/login$/);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("storefront has no horizontal overflow on a small mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  for (const path of ["/", "/shop", "/checkout"]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(1);
  }
});
