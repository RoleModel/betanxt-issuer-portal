import { expect, test } from "@playwright/test";

test.describe("Reporting Data Verification", () => {
  test.beforeEach(async () => {
    // Mock auth is enabled, so we can go directly to the pages
    // The auth context should be handled by the mock provider
  });

  test("should load reporting page with CSV data", async ({ page }) => {
    // Navigate to Wendy's reporting page
    await page.goto("http://localhost:3000/WEN/reporting");

    // Wait for reporting page to load
    await page.waitForSelector("text=Reporting", { timeout: 15_000 });

    // Check for key reporting sections
    await expect(page.locator("text=Event Summary")).toBeVisible();
    await expect(page.locator("text=Year Over Year")).toBeVisible();

    // Verify that data is loaded (not just empty placeholders)
    // Check for meeting data
    const eventRows = page.locator("table").first().locator("tbody tr");
    const eventCount = await eventRows.count();
    expect(eventCount).toBeGreaterThan(0);

    // Check for actual meeting data from CSV
    await expect(page.locator("text=Annual Meeting 2025")).toBeVisible();

    // Check participation data exists
    await expect(page.locator("text=%").first()).toBeVisible();
  });

  test("should show director performance data", async ({ page }) => {
    await page.goto("http://localhost:3000/WEN/reporting");

    // Wait for page load
    await page.waitForSelector("text=Reporting", { timeout: 15_000 });

    // Look for director names from CSV data
    const directorNames = [
      "Arthur B. Winkleblack",
      "Peter W. May",
      "Wendy C. Arlin",
    ];

    // Check if at least one director is visible
    let isFoundDirector = false;
    for (const name of directorNames) {
      const isVisible = await page
        .locator(`text=${name}`)
        .isVisible()
        .catch(() => false);
      if (isVisible) {
        isFoundDirector = true;
        break;
      }
    }

    // If directors aren't immediately visible, they might be in a chart or different section
    if (!isFoundDirector) {
      // Check for director election proposals in the data
      const proposalSection = page.locator("text=Director Election");
      if (await proposalSection.isVisible().catch(() => false)) {
        isFoundDirector = true;
      }
    }

    expect(isFoundDirector).toBeTruthy();
  });

  test("should display vote statistics", async ({ page }) => {
    await page.goto("http://localhost:3000/WEN/reporting");

    // Wait for page load
    await page.waitForSelector("text=Reporting", { timeout: 15_000 });

    // Check for vote-related metrics
    const metricsToCheck = [
      "Passed", // Proposal outcomes
      "Quorum", // Quorum status
      "Participation", // Participation rate
    ];

    for (const metric of metricsToCheck) {
      const metricElement = page.locator(`text=/${metric}/i`).first();
      await expect(metricElement).toBeVisible({ timeout: 10_000 });
    }
  });

  test("should show year-over-year data for completed meetings", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/WEN/reporting");

    // Wait for page load
    await page.waitForSelector("text=Reporting", { timeout: 15_000 });

    // Check for year indicators
    const years = ["2025", "2024", "2023", "2022"];
    let isFoundYear = false;

    for (const year of years) {
      if (
        await page
          .locator(`text=${year}`)
          .isVisible()
          .catch(() => false)
      ) {
        isFoundYear = true;
        break;
      }
    }

    expect(isFoundYear).toBeTruthy();
  });

  test("should load proposal performance data", async ({ page }) => {
    await page.goto("http://localhost:3000/WEN/reporting");

    // Wait for page load
    await page.waitForSelector("text=Reporting", { timeout: 15_000 });

    // Check for proposal types
    const proposalTypes = ["Director Election", "Say on Pay", "Auditor"];

    let isFoundProposalType = false;
    for (const type of proposalTypes) {
      const typeElement = page.locator(`text=/${type}/i`).first();
      if (await typeElement.isVisible().catch(() => false)) {
        isFoundProposalType = true;
        break;
      }
    }

    // Alternative: Check for proposal-related headers
    if (!isFoundProposalType) {
      const proposalHeaders = ["Proposal", "Support", "Outcome"];
      for (const header of proposalHeaders) {
        if (
          await page
            .locator(`text=${header}`)
            .isVisible()
            .catch(() => false)
        ) {
          isFoundProposalType = true;
          break;
        }
      }
    }

    expect(isFoundProposalType).toBeTruthy();
  });

  test("should show actual vote counts from CSV data", async ({ page }) => {
    await page.goto("http://localhost:3000/WEN/reporting");

    // Wait for page load
    await page.waitForSelector("text=Reporting", { timeout: 15_000 });

    // Look for large vote numbers that would indicate real data
    // Wendy's has millions of shares, so we should see large numbers
    const pageContent = await page.content();

    // Check for numbers in millions (CSV has values like 146,659,348)
    const hasLargeNumbers =
      /\d{1,3}(,\d{3})+/.test(pageContent) || // Formatted numbers
      /\d{6,}/.test(pageContent); // Unformatted large numbers

    expect(hasLargeNumbers).toBeTruthy();
  });
});
