import { expect, test } from "@playwright/test";

import { loginAsDemo } from "./helpers/auth";

const routes = [
  { path: "/dashboard", text: /FinCredit AI|AI-powered stock research/i },
  { path: "/portfolio", text: /My Simulated Portfolio|Holdings/i },
  { path: "/watchlist", text: /Company Watchlist|Tracked Companies/i },
  { path: "/stock/AAPL", text: /AAPL|SEC Fundamentals|Recent News/i },
  { path: "/ask", text: /Portfolio-Aware AI Assistant|Ask FinCredit AI/i },
  { path: "/reports", text: /Reports & Analyst Outputs|Generated Report Records/i },
  { path: "/governance", text: /Governance & Agent Audit|Stored LangGraph/i },
];

test.describe("route smoke tests", () => {
  for (const route of routes) {
    test(`${route.path} renders visible content`, async ({ page }) => {
      await loginAsDemo(page);
      await page.goto(route.path);

      await expect(page).toHaveURL(new RegExp(`${route.path.replace("/", "\\/")}`));
      await expect(page.locator("body")).toContainText(route.text);
    });
  }
});
