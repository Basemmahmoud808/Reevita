import { expect, test } from "@playwright/test";

async function addProductAndOpenCheckout(page: import("@playwright/test").Page) {
  await page.goto("/");
  const addToBag = page.getByRole("button", { name: /Add to bag/ }).first();
  await page.locator("article").first().hover({ position: { x: 20, y: 20 } });
  await addToBag.click();
  await expect(page.getByRole("button", { name: /سلة المشتريات — 1 منتج/ })).toBeVisible();
  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "Complete your order" })).toBeVisible();
}

async function fillCheckout(page: import("@playwright/test").Page, phone = "01012345678") {
  await page.getByLabel("Full name *").fill("سارة أحمد");
  await page.getByLabel("رقم الموبايل *").fill(phone);
  await page.getByLabel("Governorate *").selectOption({ index: 1 });
  await page.getByLabel("City / district *").fill("مدينة نصر");
  await page.getByLabel("Full address *").fill("شارع رئيسي، عمارة 10، شقة 4");
  await page.getByLabel("أوافق على الشروط والأحكام وسياسة الاسترجاع.").check();
}

test("valid COD checkout redirects to the order confirmation", async ({ page }) => {
  await addProductAndOpenCheckout(page);
  await fillCheckout(page);
  await page.getByRole("button", { name: "Confirm order" }).click();
  await expect(page).toHaveURL(/\/order\/RV-\d{4}-\d{5}$/);
});

test("invalid phone shows an error and preserves typed checkout fields", async ({ page }) => {
  await addProductAndOpenCheckout(page);
  await fillCheckout(page, "010123");
  await page.getByRole("button", { name: "Confirm order" }).click();

  await expect(page.locator("#checkout-error").getByText(/رقم هاتف محمول مصري صحيح/)).toBeVisible();
  await expect(page.getByLabel("Full name *")).toHaveValue("سارة أحمد");
  await expect(page.getByLabel("رقم الموبايل *")).toHaveValue("010123");
  await expect(page.getByLabel("City / district *")).toHaveValue("مدينة نصر");
  await expect(page.getByLabel("Full address *")).toHaveValue("شارع رئيسي، عمارة 10، شقة 4");
  await expect(page.getByLabel("أوافق على الشروط والأحكام وسياسة الاسترجاع.")).toBeChecked();
});
