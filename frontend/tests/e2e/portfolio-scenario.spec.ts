import { expect, test } from "@playwright/test";

const user = { id: 1, email: "demo@test.local", fullName: "Demo", role: "user", isActive: true, createdAt: "2026-01-01" };
const holding = { ticker: "AAPL", company: "Apple", shares: 1, avgPrice: 100, currentPrice: 100, totalCost: 100, value: 100, weight: 100, sector: "Technology", risk: "Learning", score: 50, sentiment: "Neutral", currency: "USD" };
const result = { groups: [{ currency: "USD", totalValue: 100, holdingsCount: 1, largestPositionPercent: 100, topThreePercent: 100, concentrationIndex: 1, effectiveHoldings: 1, sectorAllocation: [{ name: "Technology", weight: 100 }], scenarioValue: 80, scenarioChange: -20, scenarioChangePercent: -20, positions: [{ ticker: "AAPL", sector: "Technology", value: 100, weight: 100, shockPercent: -20, change: -20, scenarioValue: 80 }] }], warnings: [], assumptions: ["Hypothetical paper-trading scenario; not investment advice."] };

test.beforeEach(async ({ page }) => {
  await page.addInitScript((account) => {
    localStorage.setItem("fincredit_access_token", "test-token");
    localStorage.setItem("fincredit_current_user", JSON.stringify(account));
  }, user);
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/auth/me") return route.fulfill({ json: user });
    if (path === "/api/portfolio") return route.fulfill({ json: { totalValue: 100, totalCost: 100, unrealizedPL: 0, unrealizedPLPercent: 0, overallRisk: 50, highRiskExposure: 0, holdingsCount: 1, holdings: [holding], sectorAllocation: [{ name: "Technology", value: 100 }], transactions: [], message: "Test portfolio" } });
    if (path === "/api/portfolio/transactions") return route.fulfill({ json: { transactions: [] } });
    if (path === "/api/portfolio/scenario") return route.fulfill({ json: result });
    return route.fulfill({ json: {} });
  });
  await page.goto("/portfolio");
  await expect(page.getByRole("heading", { name: "Portfolio scenario lab" })).toBeVisible();
});

test("runs a sector override, displays impact, and clears stale results", async ({ page }) => {
  await page.getByLabel("Sector override").selectOption("Technology");
  await page.getByLabel("Sector shock (%)").fill("-20");
  const request = page.waitForRequest("**/api/portfolio/scenario");
  await page.getByRole("button", { name: "Run scenario" }).click();
  expect((await request).postDataJSON()).toEqual({ marketShockPercent: -10, sectorShocks: { Technology: -20 } });
  await expect(page.getByRole("heading", { name: "USD scenario results" })).toBeVisible();
  await expect(page.getByText("80.00 USD", { exact: true }).first()).toBeVisible();
  await page.getByLabel("Market shock (%)").fill("-5");
  await expect(page.getByRole("heading", { name: "USD scenario results" })).toHaveCount(0);
});

test("shows validation and recovers from API failure", async ({ page }) => {
  await page.getByLabel("Market shock (%)").fill("-101");
  await page.getByRole("button", { name: "Run scenario" }).click();
  await expect(page.getByRole("alert")).toContainText("between -100 and 100");
  await page.getByLabel("Market shock (%)").fill("-10");
  await page.route("**/api/portfolio/scenario", (route) => route.fulfill({ status: 503, json: { detail: "Unavailable" } }));
  await page.getByRole("button", { name: "Run scenario" }).click();
  await expect(page.getByRole("alert")).toContainText("Unable to calculate");
  await expect(page.getByRole("button", { name: "Run scenario" })).toBeEnabled();
});
