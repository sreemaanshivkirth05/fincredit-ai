import { expect, test } from "@playwright/test";

import { loginAsDemo } from "./helpers/auth";

test.describe("stock page", () => {
  test("loads AMZN without the old SEC CIK mapping error", async ({ page }) => {
    test.setTimeout(90_000);

    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
    const secResponse = await page.request.get(
      `${apiBaseUrl}/api/sec/company-facts/AMZN`
    );

    expect(secResponse.ok()).toBeTruthy();

    const secData = await secResponse.json();
    expect(secData.ticker).toBe("AMZN");
    expect(secData.cik).toBe("0001018724");

    await loginAsDemo(page);
    await page.goto("/stock/AMZN");

    await expect(page.locator("body")).toContainText(/AMZN/i);
    await expect(page.locator("body")).toContainText(/Price Chart/i, {
      timeout: 60_000,
    });
    await expect(page.locator("body")).toContainText(/SEC Fundamentals/i);
    await expect(page.locator("body")).not.toContainText(
      /Ticker CIK mapping not available yet|SEC company facts failed/i
    );
    await expect(page.getByTestId("stock-ask-ai").first()).toBeVisible();
    await expect(page.getByTestId("stock-add-portfolio")).toBeVisible();
  });

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
