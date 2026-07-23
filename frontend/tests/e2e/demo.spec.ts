import { expect, test } from "@playwright/test";

test.describe("dashboard demo readiness", () => {
  test("shows product explanation, CTAs, and safe demo reset affordance", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await expect(page.locator("body")).toContainText(
      /AI-powered stock research and paper-trading sandbox for beginner investors/i
    );
    await expect(page.locator("body")).toContainText(/Demo Product Loop/i);
    await expect(page.locator("body")).toContainText(/Stock Research/i);
    await expect(page.locator("body")).toContainText(/Paper Portfolio/i);
    await expect(page.locator("body")).toContainText(/Portfolio-Aware AI/i);
    await expect(page.locator("body")).toContainText(
      /simulated paper-trading and education tool/i
    );

    await expect(
      page.getByRole("link", { name: /Research AAPL/i })
    ).toHaveAttribute("href", "/stock/AAPL");
    await expect(
      page.getByRole("link", { name: /Open Portfolio/i }).first()
    ).toHaveAttribute("href", "/portfolio");
    await expect(
      page.getByRole("link", { name: /Ask FinCredit AI/i })
    ).toHaveAttribute("href", "/ask");
    await expect(
      page.getByRole("link", { name: /Open Watchlist/i })
    ).toHaveAttribute("href", "/watchlist");

    await expect(page.getByTestId("dashboard-reset-demo")).toBeVisible();
  });
});
