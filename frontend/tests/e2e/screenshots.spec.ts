import fs from "node:fs/promises";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { loginAsAdmin, loginAsDemo } from "./helpers/auth";

const screenshotDir = path.resolve(process.cwd(), "..", "docs", "screenshots");

async function capture(page: Page, filename: string) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(750);
  await page.screenshot({
    path: path.join(screenshotDir, filename),
    fullPage: true,
  });
}

test.describe("GitHub launch screenshots", () => {
  test.use({
    viewport: {
      width: 1440,
      height: 1000,
    },
  });

  test("captures public, demo, and admin product screenshots", async ({
    browser,
    page,
  }) => {
    test.setTimeout(180_000);
    await fs.mkdir(screenshotDir, { recursive: true });

    await page.goto("/");
    await expect(page.locator("body")).toContainText(/FinCredit AI/i);
    await capture(page, "landing.png");

    await page.goto("/login");
    await expect(page.locator("body")).toContainText(/Sign in|Login/i);
    await capture(page, "login.png");

    const demoContext = await browser.newContext({
      baseURL: "http://localhost:3000",
      viewport: { width: 1440, height: 1000 },
    });
    const demoPage = await demoContext.newPage();
    await loginAsDemo(demoPage);

    await demoPage.goto("/dashboard");
    await expect(demoPage.locator("body")).toContainText(/Stock Research Dashboard/i);
    await capture(demoPage, "dashboard.png");

    await demoPage.goto("/stock/AAPL");
    await expect(demoPage.locator("body")).toContainText(/AAPL/i);
    await expect(demoPage.locator("body")).toContainText(/Price Chart/i);
    await capture(demoPage, "stock-research.png");

    await demoPage.goto("/portfolio");
    await expect(demoPage.locator("body")).toContainText(/Portfolio/i);
    await capture(demoPage, "portfolio.png");

    await demoPage.goto("/watchlist");
    await expect(demoPage.locator("body")).toContainText(/Watchlist/i);
    await capture(demoPage, "watchlist.png");

    await demoPage.goto("/ask");
    await expect(demoPage.locator("body")).toContainText(/Ask/i);
    await capture(demoPage, "ask-ai.png");

    await demoContext.close();

    const adminContext = await browser.newContext({
      baseURL: "http://localhost:3000",
      viewport: { width: 1440, height: 1000 },
    });
    const adminPage = await adminContext.newPage();
    await loginAsAdmin(adminPage);

    await adminPage.goto("/admin");
    await expect(adminPage.locator("body")).toContainText(/Admin/i);
    await capture(adminPage, "admin.png");

    await adminContext.close();
  });
});
