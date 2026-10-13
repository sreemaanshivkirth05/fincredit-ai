import { expect, test } from "@playwright/test";

const user = { id: 1, email: "demo@test.local", fullName: "Demo", role: "user", isActive: true, createdAt: "2026-01-01" };

test("shows research diagnostics and bounded review after asking a question", async ({ page }) => {
  await page.addInitScript((account) => {
    localStorage.setItem("fincredit_access_token", "test-token");
    localStorage.setItem("fincredit_current_user", JSON.stringify(account));
  }, user);
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/auth/me") return route.fulfill({ json: user });
    if (path === "/api/ask") return route.fulfill({ json: {
      agentRunId: 1, question: "Challenge AAPL", answer: "Calculated fallback answer.", riskDrivers: [], evidence: [], suggestedActions: [], message: "Done",
      audit: { workflow: "Research", agentsUsed: ["Research Planner Agent", "Stress Test Agent", "Skeptical Reviewer Agent", "Percentage Review Agent"], groundingScore: 50, unsupportedClaims: 1, status: "Deterministic fallback" },
      researchDetails: { intent: "Stock research", scope: "Stored user context", coveragePercent: 50,
        checks: [{ name: "Market price", available: true, reason: "Stored snapshot" }, { name: "SEC fundamentals", available: false, reason: "Refresh financial data" }],
        scenarios: [{ name: "Severe decline", marketShockPercent: -25, sectorShocks: {}, groups: [{ currency: "USD", scenarioValue: 75, scenarioChange: -25, scenarioChangePercent: -25 }], warnings: [] }],
        challenges: ["Check concentrated exposure"],
        review: { status: "flags_found", findings: ["Percentage 88% was not found in supplied evidence."], checkedPercentages: 1, limitations: "Checks explicit percentage values only. Does not verify semantic attribution.", answerReplaced: true }
      }
    } });
    return route.fulfill({ json: {} });
  });
  await page.goto("/ask");
  await page.getByTestId("ask-question-input").fill("Challenge my AAPL thesis");
  await page.getByTestId("ask-submit-button").click();
  const panel = page.getByTestId("research-workbench");
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("SEC fundamentals: Missing");
  await expect(panel).toContainText("Severe decline · USD");
  await expect(panel).toContainText("A deterministic answer replaced it");
  await expect(panel).toContainText("Does not verify semantic attribution");
  await expect(page.getByTestId("ask-audit-card")).toContainText("Evidence Availability");
});
