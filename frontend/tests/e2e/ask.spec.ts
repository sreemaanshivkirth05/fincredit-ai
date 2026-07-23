import { expect, test } from "@playwright/test";

test.describe("ask page", () => {
  test(
    "submits a portfolio-aware AAPL question and renders answer sections",
    async ({ page }) => {
      test.setTimeout(70_000);

      await page.goto("/ask");

      const questionInput = page.getByTestId("ask-question-input");
      await expect(questionInput).toBeVisible();

      await questionInput.fill(
        "Should I add more AAPL to my simulated portfolio? Use transactions and evidence."
      );

      await page.getByTestId("ask-submit-button").click();

      await expect(page.locator("body")).toContainText(
        /Loading portfolio context|Reading transaction history|Generating AI answer or fallback/i
      );

      await expect(page.getByTestId("ask-answer-card")).toBeVisible({
        timeout: 45_000,
      });
      await expect(page.getByTestId("ask-evidence-card")).toBeVisible();
      await expect(page.getByTestId("ask-audit-card")).toBeVisible();

      await expect(page.locator("body")).toContainText(/Evidence Used/i);
      await expect(page.locator("body")).toContainText(/Governance Audit/i);
    }
  );
});
