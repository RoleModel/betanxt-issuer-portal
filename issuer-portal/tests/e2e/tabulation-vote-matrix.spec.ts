import { expect, test } from "@playwright/test";

test("voting activity chart shows sources only, not holder types", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1500, height: 950 });
  await page.goto("/WEN/meeting/wen-special-meeting-2026/tabulation");

  await expect(
    page.getByRole("heading", { name: "Voting Activity" })
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("vote-matrix-total-web")).toBeVisible();
  await expect(page.getByTestId("source-holder-legend-registered")).toHaveCount(
    0
  );
  await expect(page.getByTestId("source-holder-legend-beneficial")).toHaveCount(
    0
  );
});

test("source toggles update the total label foreground", async ({ page }) => {
  await page.setViewportSize({ width: 1500, height: 950 });
  await page.goto("/WEN/meeting/wen-special-meeting-2026/tabulation");

  const webTotal = page.getByTestId("vote-matrix-total-web");
  await expect(webTotal).toBeVisible({ timeout: 30_000 });

  const initialFill = await webTotal.getAttribute("data-inside-fill");
  if (initialFill === null) {
    throw new Error("Expected the web total to expose its inside fill");
  }

  await page.getByTestId("source-legend-ivr").click();

  // Toggling a different source shouldn't move web's own bar/label.
  await expect(webTotal).toHaveAttribute("data-inside-fill", initialFill);
});

test("hiding all sources does not render totals with invalid coordinates", async ({
  page,
}) => {
  const svgErrors: string[] = [];
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      message.text().includes('Expected length, "NaN"')
    ) {
      svgErrors.push(message.text());
    }
  });

  await page.setViewportSize({ width: 1500, height: 950 });
  await page.goto("/WEN/meeting/wen-special-meeting-2026/tabulation");
  await expect(page.getByTestId("vote-matrix-total-web")).toBeVisible({
    timeout: 30_000,
  });

  for (const source of ["web", "print", "ivr", "solicitor"] as const) {
    await page.getByTestId(`source-legend-${source}`).click();
  }

  await expect(page.getByTestId("vote-matrix-total-web")).toHaveCount(0);
  await expect(page.getByTestId("vote-matrix-total-print")).toHaveCount(0);
  expect(svgErrors).toEqual([]);
});
