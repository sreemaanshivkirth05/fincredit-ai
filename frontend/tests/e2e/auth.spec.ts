import { expect, test } from "@playwright/test";

import { clearAuth, loginAsDemo } from "./helpers/auth";

test.describe("authentication", () => {
  test("login page loads and demo credentials can log in", async ({ page }) => {
    await clearAuth(page);
    await page.goto("/login");

    await expect(page.locator("body")).toContainText(/Login|Welcome back/i);
    await expect(page.getByTestId("login-email")).toHaveValue(
      "demo@fincredit.ai"
    );

    await page.getByTestId("login-submit").click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("body")).toContainText(/FinCredit AI/i);
  });

  test("profile shows demo user and logout returns to login", async ({ page }) => {
    await loginAsDemo(page);
    await page.goto("/profile");

    await expect(page.locator("body")).toContainText(/demo@fincredit.ai/i);
    await expect(page.locator("body")).toContainText(/unique to this account/i);

    await page.getByTestId("profile-logout").click();
    await expect(page).toHaveURL(/\/login/);
  });
});
