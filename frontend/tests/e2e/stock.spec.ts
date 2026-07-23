import { expect, test } from "@playwright/test";

import { loginAsDemo } from "./helpers/auth";

test.describe("stock page", () => {
  test("stock search API and UI can find a broader ticker", async ({ page }) => {
    test.setTimeout(90_000);

    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
    const searchResponse = await page.request.get(
      `${apiBaseUrl}/api/stocks/search?q=amaz&limit=5`
    );

    expect(searchResponse.ok()).toBeTruthy();

    const searchData = await searchResponse.json();
    expect(
      searchData.results.some((result: { ticker: string }) => result.ticker === "AMZN")
    ).toBeTruthy();

    await loginAsDemo(page);
    await page.goto("/dashboard");
    await page.getByTestId("stock-search-input").fill("amaz");

    const results = page.getByTestId("stock-search-results");
    await expect(results).toContainText(/AMZN/i, { timeout: 30_000 });
    await results.getByRole("button", { name: /AMZN/i }).first().click();

    await expect(page).toHaveURL(/\/stock\/AMZN/);
    await expect(page.locator("body")).toContainText(/Price Chart/i, {
      timeout: 60_000,
    });
    await expect(page.getByTestId("stock-intelligence-section")).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByTestId("intelligence-scorecard")).toBeVisible();
    await expect(page.getByTestId("decision-readiness-score")).toBeVisible();
    await expect(page.getByTestId("evidence-strength-meter")).toBeVisible();
  });

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
    await expect(page.getByTestId("stock-intelligence-section")).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByTestId("intelligence-scorecard")).toBeVisible();
    await expect(page.getByTestId("decision-readiness-score")).toBeVisible();
    await expect(page.getByTestId("evidence-strength-meter")).toBeVisible();
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
    await expect(page.getByTestId("stock-intelligence-section")).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByTestId("intelligence-scorecard")).toBeVisible();
    await expect(page.getByTestId("financial-health-scanner")).toBeVisible();
    await expect(page.getByTestId("valuation-reality-check")).toBeVisible();
    await expect(page.getByTestId("bull-bear-base-case")).toBeVisible();
    await expect(page.getByTestId("decision-readiness-score")).toBeVisible();
    await expect(page.getByTestId("evidence-strength-meter")).toBeVisible();

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

  test("keeps intelligence usable when SEC or valuation evidence is incomplete", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    await loginAsDemo(page);
    await page.goto("/stock/SPY");

    await expect(page.locator("body")).toContainText(/SPY/i);
    await expect(page.locator("body")).toContainText(/Price Chart/i, {
      timeout: 60_000,
    });
    await expect(page.getByTestId("stock-intelligence-section")).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByTestId("valuation-reality-check")).toBeVisible();
    await expect(page.getByTestId("decision-readiness-score")).toBeVisible();
    await expect(page.getByTestId("evidence-strength-meter")).toBeVisible();
    await expect(page.locator("body")).not.toContainText(
      /Ticker CIK mapping not available yet|SEC company facts failed/i
    );
  });
});
