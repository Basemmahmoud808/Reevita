import { expect, test } from "@playwright/test";

async function addFirstProductToBag(page: import("@playwright/test").Page) {
  await page.goto("/shop");
  await page.locator("article").first().hover({ position: { x: 20, y: 20 } });
  await page.getByRole("button", { name: /Add to bag|أضيفي للسلة/i }).first().click();
}

test("cart supports add, quantity change and removal", async ({ page }) => {
  await addFirstProductToBag(page);

  // Adding a product opens the cart drawer, so the drawer controls are active immediately.
  await expect(page.getByRole("button", { name: /سلة المشتريات — 1 منتج/ })).toBeVisible();

  await page.getByRole("button", { name: "زيادة الكمية" }).first().click();
  await expect(page.getByRole("button", { name: /سلة المشتريات — 2 منتج/ })).toBeVisible();

  await page.getByRole("button", { name: /إزالة .* من السلة/ }).first().click();
  await expect(page.getByRole("button", { name: "سلة المشتريات", exact: true })).toBeVisible();
});

test("checkout rejects an empty cart without creating an order", async ({ page }) => {
  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "Checkout unavailable" })).toBeVisible();
  await expect(page).not.toHaveURL(/\/order\//);
});

test("double-clicking confirm does not create a second order", async ({ page }) => {
  await addFirstProductToBag(page);
  await page.goto("/checkout");
  await page.getByLabel("Full name *").fill("سارة أحمد");
  await page.getByLabel("رقم الموبايل *").fill("01012345678");
  await page.getByLabel("Governorate *").selectOption({ index: 1 });
  await page.getByLabel("City / district *").fill("مدينة نصر");
  await page.getByLabel("Full address *").fill("شارع رئيسي، عمارة 10، شقة 4");
  await page.getByLabel("أوافق على الشروط والأحكام وسياسة الاسترجاع.").check();

  const confirm = page.getByRole("button", { name: "Confirm order" });
  await confirm.click();
  await confirm.click({ timeout: 2000 }).catch(() => {});

  await expect(page).toHaveURL(/\/order\/RV-\d{4}-\d{5}$/);
  await expect(page.getByRole("heading", { name: "تم استلام طلبك بنجاح" })).toBeVisible();

  // The demo order sequence is contiguous, so the next number must not exist if the
  // repeated submission was absorbed by the idempotency key.
  const orderNumber = page.url().split("/").pop() as string;
  const [prefix, year, sequence] = orderNumber.split("-");
  const nextNumber = `${prefix}-${year}-${String(Number(sequence) + 1).padStart(5, "0")}`;

  await page.goto(`/track?order=${nextNumber}`);
  await page.getByLabel("رقم الطلب").fill(nextNumber);
  await page.getByLabel("رقم الموبايل").fill("01012345678");
  await page.getByRole("button", { name: /تتبّع|بحث/ }).first().click();
  await expect(page.getByText("لم نجد طلبًا مطابقًا")).toBeVisible();
});

test("demo admin can sign in and reach the dashboard", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByRole("button", { name: "دخول العرض التجريبي" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "لوحة التحكم" })).toBeVisible();
});

test("anonymous visitors cannot open admin sub-pages", async ({ page }) => {
  for (const path of ["/admin/orders", "/admin/products", "/admin/shipping"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/admin\/login$/);
  }
});
