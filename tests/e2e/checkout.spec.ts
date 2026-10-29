import { expect, test } from "@playwright/test";

test("out-of-stock products stay out of the bag and checkout explains why it cannot continue", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /Add to bag/ }).first()).toBeDisabled();

  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: "Your bag is empty" })).toBeVisible();
  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "Checkout unavailable" })).toBeVisible();
});

test("checkout rejects an invalid phone and preserves the other entered details", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("rv_cart_v1", JSON.stringify([{
      productId: "33333333-0000-0000-0000-000000000002",
      slug: "shampoo-blueberry",
      nameAr: "ريفيتا شامبو توت أزرق",
      price: 220,
      compareAtPrice: null,
      image: "/images/supplied/Gemini_Generated_Image_echqdaechqdaechq.jpg",
      size: "300 مل",
      variantLabelAr: "توت أزرق",
      quantity: 1,
      maxQuantity: 10,
    }]));
  });

  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "Complete your order" })).toBeVisible();
  await page.getByLabel("Full name *").fill("سارة أحمد");
  await page.getByLabel("رقم الموبايل *").fill("010123");
  await page.getByLabel("Governorate *").selectOption({ index: 1 });
  await page.getByLabel("City / district *").fill("مدينة نصر");
  await page.getByLabel("Full address *").fill("شارع رئيسي، عمارة 10، شقة 4");
  await page.getByLabel("أوافق على الشروط والأحكام وسياسة الاسترجاع.").check();
  await page.getByRole("button", { name: "Confirm order" }).click();

  await expect(page.locator("#checkout-error").getByText(/رقم هاتف محمول مصري صحيح/)).toBeVisible();
  await expect(page.getByLabel("Full name *")).toHaveValue("سارة أحمد");
  await expect(page.getByLabel("رقم الموبايل *")).toHaveValue("010123");
  await expect(page.getByLabel("Governorate *")).not.toHaveValue("");
  await expect(page.getByLabel("City / district *")).toHaveValue("مدينة نصر");
  await expect(page.getByLabel("Full address *")).toHaveValue("شارع رئيسي، عمارة 10، شقة 4");
  await expect(page.getByLabel("أوافق على الشروط والأحكام وسياسة الاسترجاع.")).toBeChecked();
});
