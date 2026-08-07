import { expect, test } from "@playwright/test";

import { releaseTabulation } from "../helpers/tabulation";

// Tabulation is withheld until a CSM releases it, so these specs state that
// precondition rather than asserting against the locked empty state.
test.beforeEach(async ({ request }) => {
  await releaseTabulation(request, "wen-annual-meeting-2025");
});

const REPORTS_URL = "/WEN/meeting/wen-annual-meeting-2025/reports";

test.describe("Reporting data", () => {
  test("shows the vote distribution built from the meeting positions", async ({
    page,
  }) => {
    await page.goto(REPORTS_URL);

    await expect(
      page.getByText("Vote Distribution by Account Type", { exact: true })
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("totalCount")).toBeVisible();

    // A populated position dataset renders a concentric chart rather than the
    // empty-state card. The exact values remain presentation-mode dependent.
    await expect(page.locator(".MuiPieArc-root").first()).toBeVisible();
  });

  test("keeps the tabulation report available beside live meeting data", async ({
    page,
  }) => {
    await page.goto(REPORTS_URL);

    await expect(
      page.getByText(/Tabulation Results/, { exact: false })
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByText(
        "Results for each proposal, showing vote counts, percentages, and quorum status."
      )
    ).toBeVisible();
  });

  test("lists the meeting's available reports", async ({ page }) => {
    await page.goto(REPORTS_URL);

    await expect(page.getByRole("table").first()).toBeVisible({
      timeout: 20_000,
    });
  });
});
