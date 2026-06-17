import { expect, test } from "@playwright/test";

/**
 * E2E contracts for 002-tabulation-enhancements
 * (specs/002-tabulation-enhancements/contracts/ui-contracts.md)
 *
 * WEN is an Engage-enabled client (has the "nobo" feature key in seed data);
 * PAYC is not, so it is used to verify NOBO feature gating.
 */

const WEN_TABULATION_URL = "http://localhost:3000/WEN/meeting/wen-annual-meeting-2025/tabulation";
const WEN_REPORTS_URL = "http://localhost:3000/WEN/meeting/wen-annual-meeting-2025/reports";
const WEN_NOBO_URL = "http://localhost:3000/WEN/meeting/wen-annual-meeting-2025/nobo";
const WEN_REPORTING_URL = "http://localhost:3000/WEN/reporting";
const PAYC_TABULATION_URL =
  "http://localhost:3000/PAYC/meeting/payc-annual-meeting-2025/tabulation";

test.describe("C1 — Voting Activity registered-only labeling", () => {
  test("chart title explicitly states Registered Holders", async ({ page }) => {
    await page.goto(WEN_TABULATION_URL);

    await expect(page.getByText("Voting Activity — Registered Holders")).toBeVisible({
      timeout: 20000,
    });
  });
});

test.describe("C2 — Shares Voted proposal selector", () => {
  test("selector defaults to Proposal 1 and switching updates the chart header", async ({
    page,
  }) => {
    await page.goto(WEN_TABULATION_URL);

    const proposalSelect = page.getByLabel("Proposal", { exact: true }).first();
    await expect(proposalSelect).toBeVisible({ timeout: 20000 });

    // Default view is the lowest-numbered proposal.
    await expect(page.getByText(/^Proposal 1:/).first()).toBeVisible();

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

test.describe("C3 — Total Votes removal", () => {
  test("tabulation view no longer renders a Total Votes column", async ({ page }) => {
    await page.goto(WEN_TABULATION_URL);

    // Wait for the tabulation table content to be present first.
    await expect(page.getByText("Voting Activity — Registered Holders")).toBeVisible({
      timeout: 20000,
    });

    await expect(page.getByRole("columnheader", { name: "Total Votes" })).toHaveCount(0);
  });
});

test.describe("C4 — Reports dropdown + Broker Breakout", () => {
  test("report dropdown lists Broker Breakout Report and rows are downloadable", async ({
    page,
  }) => {
    await page.goto(WEN_REPORTS_URL);

    await expect(page.getByText("Download Meeting Reports")).toBeVisible({
      timeout: 20000,
    });

    const reportSelect = page.getByLabel("Report", { exact: true }).first();
    await expect(reportSelect).toBeVisible();
    await reportSelect.click();

    await expect(page.getByRole("option", { name: /Broker Breakout Report/ })).toBeVisible();
    await page.keyboard.press("Escape");

    // No permanently disabled download rows: every PDF download button enabled.
    const pdfButtons = page.getByRole("button", { name: /as PDF$/ });
    const count = await pdfButtons.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      await expect(pdfButtons.nth(index)).toBeEnabled();
    }
  });
});

test.describe("C6/C7 — Reporting tab analytics + quorum timeline", () => {
  test("quorum timeline replaces Early/Late segmentation", async ({ page }) => {
    await page.goto(WEN_REPORTING_URL);

    await expect(page.getByText("Quorum Timeline")).toBeVisible({ timeout: 20000 });

    await expect(page.getByText(/Early Votes %/)).toHaveCount(0);
    await expect(page.getByText(/Late Votes %/)).toHaveCount(0);
  });

  test("previously orphaned charts are mounted", async ({ page }) => {
    await page.goto(WEN_REPORTING_URL);

    await expect(page.getByText("Analytics", { exact: true })).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByText("Participation by Year")).toBeVisible();
  });
});

test.describe("C8 — Geographic heat map", () => {
  test("metric toggle and population filters render with correct defaults", async ({ page }) => {
    await page.goto(WEN_REPORTING_URL);

    await expect(page.getByText("Geographic Distribution")).toBeVisible({
      timeout: 20000,
    });

    // Metric toggle.
    const metricGroup = page.getByRole("group", { name: "Heat map metric" });
    await expect(metricGroup.getByRole("button", { name: "Shareholders" })).toBeVisible();
    await expect(metricGroup.getByRole("button", { name: "Shares Held" })).toBeVisible();

    // Default populations: Registered + Plan checked, Beneficial unchecked.
    await expect(page.getByLabel("Registered", { exact: true })).toBeChecked();
    await expect(page.getByLabel("Plan", { exact: true })).toBeChecked();
    await expect(page.getByLabel("Beneficial", { exact: true })).not.toBeChecked();

    // WEN has the nobo feature, so the NOBO checkbox is present and unchecked.
    await expect(page.getByLabel("NOBO", { exact: true })).not.toBeChecked();
  });
});

test.describe("C9 — NOBO tab feature gating", () => {
  test("NOBO tab visible for Engage-enabled client and page renders positions", async ({
    page,
  }) => {
    await page.goto(WEN_TABULATION_URL);

    const noboTab = page.getByRole("tab", { name: "NOBO" });
    await expect(noboTab).toBeVisible({ timeout: 20000 });

    await page.goto(WEN_NOBO_URL);
    await expect(page.getByText("NOBO Positions")).toBeVisible({ timeout: 20000 });
  });

  test("NOBO tab hidden for clients without the nobo feature", async ({ page }) => {
    await page.goto(PAYC_TABULATION_URL);

    await expect(page.getByRole("tab", { name: "Tabulation" })).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByRole("tab", { name: "NOBO" })).toHaveCount(0);
  });
});
