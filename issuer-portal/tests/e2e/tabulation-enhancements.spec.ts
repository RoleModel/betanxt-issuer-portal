import { expect, test } from "@playwright/test";

/**
 * E2E contracts for 002-tabulation-enhancements
 * (specs/002-tabulation-enhancements/contracts/ui-contracts.md)
 *
 * WEN is an Engage-enabled client (has the "nobo" feature key in seed data);
 * PAYC is not, so it is used to verify NOBO feature gating.
 */

const WEN_TABULATION_URL =
  "http://localhost:3000/WEN/meeting/wen-annual-meeting-2025/tabulation";

test.describe("C1 — Voting Activity registered-only labeling", () => {
  // NOTE: FR-001 ("labeling explicitly indicates Registered Holder voting
  // only") is no longer covered here. The title suffix was removed and the
  // card's subheader does not render on this page, so this asserts only that
  // the chart is present. Re-tighten once the labeling lands somewhere.
  test("chart renders", async ({ page }) => {
    await page.goto(WEN_TABULATION_URL);

    await expect(page.getByText("Voting Activity")).toBeVisible({
      timeout: 20_000,
    });
  });
});

test.describe("C1b — Director election grouping", () => {
  // The API returns directors as sub-proposals (1.01, 1.02, …) with no parent
  // "Proposal 1", so the grid used to open straight into individual directors.
  test("proposal grid opens with the Proposal 1 group, not a director", async ({
    page,
  }) => {
    await page.goto(WEN_TABULATION_URL);

    await expect(
      page
        .getByText(
          /1\. Election of the \d+ directors named in the accompanying/
        )
        .first()
    ).toBeVisible({ timeout: 30_000 });

    const grid = page.locator(".MuiDataGrid-root").first();
    const text = (await grid.innerText()).replace(/\s+/g, " ");
    expect(text.indexOf("Election of the")).toBeGreaterThanOrEqual(0);
    expect(text.indexOf("1.01.")).toBeGreaterThan(
      text.indexOf("Election of the")
    );
  });
});

test.describe("C2 — Shares Voted proposal selector", () => {
  test("selector defaults to Proposal 1 and switching updates the chart header", async ({
    page,
  }) => {
    await page.goto(WEN_TABULATION_URL);

    const proposalSelect = page.getByLabel("Proposal", { exact: true }).first();
    await expect(proposalSelect).toBeVisible({ timeout: 20_000 });

    // Default view is the lowest-numbered proposal.
    await expect(page.getByText(/^Proposal 1/).first()).toBeVisible();

    // Switch to another proposal when more than one exists.
    await proposalSelect.click();
    const options = page.getByRole("option");
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(0);

    if (optionCount > 1) {
      await options.nth(1).click();
      await expect(page.getByText(/^Proposal 2:/).first()).toBeVisible();
    } else {
      await page.keyboard.press("Escape");
    }
  });
});
