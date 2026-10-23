import { expect, test } from "@playwright/test";

test("demo customer can sign in, view the account, and sign out", async ({ page }) => {
  await page.goto("/account/login");
  await page.getByLabel("البريد الإلكتروني").fill("mona@example.com");
  await page.getByLabel("كلمة المرور").fill("password123");
  await page.getByRole("button", { name: "تسجيل الدخول" }).click();

  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole("heading", { name: "حسابي" })).toBeVisible();

  // The session cookie must not be readable from JavaScript.
  const sessionCookie = (await page.context().cookies()).find((cookie) => cookie.name === "rv_demo_user");
  expect(sessionCookie, "session cookie is set").toBeTruthy();
  expect(sessionCookie?.httpOnly).toBe(true);
  expect(sessionCookie?.sameSite).toBe("Lax");

  await page.getByRole("button", { name: "تسجيل الخروج" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/account");
  await expect(page).toHaveURL(/\/account\/login$/);
});
