import { expect, test } from "@playwright/test";

test.describe("portfolio page", () => {
  test("loads, refreshes prices, shows transactions, and opens sell form", async ({
    page,
  }) => {
    await page.goto("/portfolio");

    await expect(page.locator("body")).toContainText(/My Simulated Portfolio|Holdings/i);

    const refreshButton = page.getByTestId("portfolio-refresh-prices");
    await expect(refreshButton).toBeVisible();
    await refreshButton.click();

    await expect(refreshButton).toBeEnabled({ timeout: 45_000 });
    await expect(page.locator("body")).toContainText(/Holdings|Portfolio Value/i);

    await expect(page.getByTestId("portfolio-transaction-history")).toBeVisible();
    await expect(page.locator("body")).toContainText(/Transaction History/i);

    const sellButton = page.getByTestId("portfolio-sell-button").first();

    if (await sellButton.isVisible().catch(() => false)) {
      await sellButton.click();
      await expect(page.getByTestId("portfolio-sell-form")).toBeVisible();
      await expect(page.locator("body")).toContainText(/Shares to Sell|Sell Price/i);
    }
  });
});
