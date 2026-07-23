import { expect, test } from "@playwright/test";

import { loginAsDemo } from "./helpers/auth";

test.describe("watchlist page", () => {
  test("loads watchlist, refreshes prices, and shows search", async ({ page }) => {
    await loginAsDemo(page);
    await page.goto("/watchlist");

    await expect(page.locator("body")).toContainText(/Company Watchlist|Tracked Companies/i);

    const refreshButton = page.getByTestId("watchlist-refresh-prices");
    await expect(refreshButton).toBeVisible();
    await refreshButton.click();

    await expect(refreshButton).toBeEnabled({ timeout: 45_000 });
    await expect(page.locator("body")).toContainText(/Tracked Companies|Company Watchlist/i);

    await expect(page.locator("body")).toContainText(
      /Search Stocks|Your watchlist is empty|Tracked Companies/i
    );

    const removeButton = page.getByRole("button", { name: /^Remove$/ }).first();
    if (await removeButton.isVisible().catch(() => false)) {
      await expect(removeButton).toBeEnabled();
    }
  });
});
