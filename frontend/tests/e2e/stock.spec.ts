import { expect, test } from "@playwright/test";

import { loginAsDemo } from "./helpers/auth";

test.describe("stock page", () => {
  test("loads AAPL research page and navigates to Ask with prefilled question", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    await loginAsDemo(page);
    await page.goto("/stock/AAPL");

    await expect(page.locator("body")).toContainText(/AAPL/i);
    await expect(page.locator("body")).toContainText(/Price Chart/i, {
      timeout: 60_000,
    });
    await expect(page.locator("body")).toContainText(/SEC Fundamentals/i);
    await expect(page.locator("body")).toContainText(/Recent News/i);

    await expect(page.getByTestId("stock-add-portfolio")).toBeVisible();
    await expect(page.locator("body")).toContainText(/Watchlist/i);

    const askLink = page.getByTestId("stock-ask-ai").first();
    await expect(askLink).toBeVisible();
    await askLink.click();

    await expect(page).toHaveURL(/\/ask\?question=/);
    await expect(page.getByTestId("ask-question-input")).toHaveValue(
      /transaction history|refreshed prices/i
    );
  });
});
