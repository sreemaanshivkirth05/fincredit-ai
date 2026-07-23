import { expect, test } from "@playwright/test";

import { clearAuth, loginAsAdmin, loginAsDemo } from "./helpers/auth";

test.describe("admin console", () => {
  test("admin login can access admin dashboard", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin");

    await expect(page.getByTestId("admin-page")).toContainText(/Admin Console/i);
    await expect(page.getByTestId("admin-overview")).toBeVisible();
    await expect(page.getByTestId("admin-users-table")).toBeVisible();
    await expect(page.getByTestId("admin-user-detail")).toBeVisible();
  });

  test("demo user sees access denied on admin page", async ({ page }) => {
    await loginAsDemo(page);
    await page.goto("/admin");

    await expect(page.getByTestId("admin-access-denied")).toContainText(
      /Access denied/i
    );
  });

  test("logged-out user is redirected to login", async ({ page }) => {
    await clearAuth(page);
    await page.goto("/admin");

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("body")).toContainText(/Login|Welcome back/i);
  });
});
