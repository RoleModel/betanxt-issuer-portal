import { expect, test } from "@playwright/test";

test.describe("Past Meetings Page", () => {
  test("should display past meetings table with CSV data", async ({ page }) => {
    // Navigate to Wendy's past meetings
    await page.goto("http://localhost:3000/WEN/past-meetings");

    // Wait for page to load
    await page.waitForSelector("text=Past Meetings", { timeout: 15000 });

    // Check for table headers
    await expect(
      page.locator('.MuiTableCell-root span:text("Meeting")')
    ).toBeVisible();
    await expect(
      page.locator('.MuiTableCell-root span:text("CUSIP")')
    ).toBeVisible();
    await expect(
      page.locator('.MuiTableCell-root span:text("Date")')
    ).toBeVisible();
    await expect(
      page.locator('.MuiTableCell-root span:text("Participation")')
    ).toBeVisible();

    // Check for meeting data
    const tableRows = page.locator("tbody tr");
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test("should show 2025 annual meeting with real participation data", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/WEN/past-meetings");

    // Wait for table to load
    await page.waitForSelector("tbody tr", { timeout: 15000 });

    // Look for 2025 annual meeting
    const annual2025Row = page
      .locator("tr", { hasText: "Annual Meeting" })
      .filter({ hasText: "2025" });
    await expect(annual2025Row).toBeVisible();

    // Check for CUSIP
    await expect(annual2025Row.locator("text=95058W100")).toBeVisible();

    // Participation is seeded demo data in the 60–75% range
    const participationCell = annual2025Row.locator("td").nth(3);
    const participationText = await participationCell.textContent();

    expect(participationText).toMatch(/\d+\.?\d*%/);
    const percentMatch = participationText?.match(/(\d+\.?\d*)%/);
    if (percentMatch) {
      const percent = parseFloat(percentMatch[1]);
      expect(percent).toBeGreaterThanOrEqual(60);
      expect(percent).toBeLessThanOrEqual(75);
    }

    // Check for vote count visualization (progress bar)
    const progressBar = annual2025Row.locator('[role="progressbar"]');
    if (await progressBar.isVisible().catch(() => false)) {
      const ariaValueNow = await progressBar.getAttribute("aria-valuenow");
      expect(ariaValueNow).toBeTruthy();
    }
  });

  test("should show special meetings with data", async ({ page }) => {
    await page.goto("http://localhost:3000/WEN/past-meetings");

    // Wait for table to load
    await page.waitForSelector("tbody tr", { timeout: 15000 });

    // Look for special meetings
    const specialMeetingRows = page.locator("tr", {
      hasText: "Special Meeting",
    });
    const specialCount = await specialMeetingRows.count();
    expect(specialCount).toBeGreaterThan(0);

    // Check first special meeting has data
    if (specialCount > 0) {
      const firstSpecial = specialMeetingRows.first();

      // Should have CUSIP
      await expect(firstSpecial.locator("text=95058W100")).toBeVisible();

      // Should have a date
      const dateCell = firstSpecial.locator("td").nth(2);
      const dateText = await dateCell.textContent();
      expect(dateText).toMatch(/\d{4}/); // Should contain a year
    }
  });

  test("should show vote counts in correct format", async ({ page }) => {
    await page.goto("http://localhost:3000/WEN/past-meetings");

    // Wait for table to load
    await page.waitForSelector("tbody tr", { timeout: 15000 });

    // Get all rows
    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();

    // Check at least one row for vote count format
    // Vote counts are shown in the participation column (4th column)
    for (let i = 0; i < Math.min(rowCount, 3); i++) {
      const row = rows.nth(i);
      const participationCell = row.locator("td").nth(3);
      // Look for the secondary text that shows vote count
      const voteCountText = await participationCell
        .locator("p:nth-of-type(2)")
        .textContent();

      if (voteCountText && voteCountText.trim() !== "") {
        // Should show vote count in format like "2.5M" or "133.3M" or "34.4K" or "0"
        expect(voteCountText).toMatch(/^\d+\.?\d*[KMB]?$/);
        break;
      }
    }
  });

  test("should show meetings from multiple years", async ({ page }) => {
    await page.goto("http://localhost:3000/WEN/past-meetings");

    // Wait for table to load
    await page.waitForSelector("tbody tr", { timeout: 15000 });

    // Look for different years in the date column
    const years = new Set<string>();
    const dateColumns = page.locator("tbody tr td:nth-child(3)"); // Date is 3rd column

    const dateCount = await dateColumns.count();
    for (let i = 0; i < dateCount; i++) {
      const dateText = await dateColumns.nth(i).textContent();
      if (dateText) {
        // Extract year from date
        const yearMatch = dateText.match(/20\d{2}/);
        if (yearMatch) {
          years.add(yearMatch[0]);
        }
      }
    }

    // Should have meetings from multiple years
    expect(years.size).toBeGreaterThan(1);

    // Should include at least 2025 (from CSV data)
    expect(years.has("2025")).toBeTruthy();
  });

  test("should display correct participation percentages", async ({ page }) => {
    await page.goto("http://localhost:3000/WEN/past-meetings");

    // Wait for table to load
    await page.waitForSelector("tbody tr", { timeout: 15000 });

    // Check participation column values
    const participationCells = page.locator("tbody tr td:nth-child(4)"); // Participation is 4th column
    const cellCount = await participationCells.count();

    let hasValidPercentages = false;
    for (let i = 0; i < cellCount; i++) {
      const cell = participationCells.nth(i);
      const text = await cell.textContent();

      if (text && text.includes("%")) {
        hasValidPercentages = true;

        // Extract percentage value
        const percentMatch = text.match(/(\d+\.?\d*)%/);
        if (percentMatch) {
          const percent = parseFloat(percentMatch[1]);
          expect(percent).toBeGreaterThanOrEqual(60);
          expect(percent).toBeLessThanOrEqual(75);
        }
      }
    }

    expect(hasValidPercentages).toBeTruthy();
  });

  test("should handle multiple client tickers", async ({ page }) => {
    // Test Wendy's first
    await page.goto("http://localhost:3000/WEN/past-meetings");
    await page.waitForSelector("tbody tr", { timeout: 15000 });

    const wenRows = await page.locator("tbody tr").count();
    expect(wenRows).toBeGreaterThan(0);

    // Test Paycom
    await page.goto("http://localhost:3000/PAYC/past-meetings");
    await page.waitForSelector("tbody tr", { timeout: 15000 });

    const paycRows = await page.locator("tbody tr").count();
    expect(paycRows).toBeGreaterThan(0);

    // Verify CUSIP is different
    const paycCusip = await page
      .locator("tbody tr")
      .first()
      .locator("td:nth-child(2)")
      .textContent();
    expect(paycCusip).not.toBe("95058W100"); // Should not be Wendy's CUSIP
  });

  test("should show proper vote count formatting with M/K suffixes", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/WEN/past-meetings");
    await page.waitForSelector("tbody tr", { timeout: 15000 });

    // Find rows with high participation (should have vote counts)
    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();

    let foundFormattedCount = false;
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const participationCell = row.locator("td:nth-child(4)");
      const participationText = await participationCell.textContent();

      // Look for rows with > 1% participation (likely to have vote counts displayed)
      if (participationText && participationText.includes("%")) {
        const percentMatch = participationText.match(/(\d+\.?\d*)%/);
        if (percentMatch && parseFloat(percentMatch[1]) > 1) {
          // Vote counts are shown as secondary text in the participation cell
          const voteCountText = await participationCell
            .locator("p:nth-of-type(2)")
            .textContent();

          if (voteCountText && voteCountText.match(/\d+\.?\d*[MK]/)) {
            foundFormattedCount = true;
            break;
          }
        }
      }
    }

    // At least some meetings should have formatted vote counts
    expect(foundFormattedCount).toBeTruthy();
  });
});
