import { expect, test } from "@playwright/test";

test.describe("public landing page", () => {
  test("shows landing content and links into working app flows", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByTestId("landing-hero")).toContainText(
      /Learn stocks by researching/i
    );
    await expect(page.locator("body")).toContainText(/FinCredit AI/i);
    await expect(page.getByTestId("landing-feature-grid")).toBeVisible();
    await expect(page.getByTestId("landing-how-it-works")).toContainText(
      /How it Works/i
    );
    await expect(page.getByTestId("landing-disclaimer")).toContainText(
      /not financial advice/i
    );

    await expect(
      page.getByRole("link", { name: /Try Demo \/ Login/i })
    ).toHaveAttribute("href", "/login");
    await expect(
      page.getByRole("link", { name: /Create Account/i })
    ).toHaveAttribute("href", "/register");
    await expect(page.getByTestId("landing-open-app")).toHaveAttribute(
      "href",
      "/dashboard"
    );
    await expect(page.getByTestId("landing-research-aapl")).toHaveAttribute(
      "href",
      "/stock/AAPL"
    );
    await expect(page.getByTestId("landing-ask-ai")).toHaveAttribute(
      "href",
      "/ask"
    );

    await page.getByRole("link", { name: /Try Demo \/ Login/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
