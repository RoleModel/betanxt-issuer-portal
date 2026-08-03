import { expect, test } from "@playwright/test";

test("tabulation combines holder type, source, and outcome in one chart", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1500, height: 950 });
  await page.goto("/WEN/meeting/wen-special-meeting-2026/tabulation");

  await expect(page.getByText("Vote Breakdown", { exact: true })).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    page.getByText("Voted shares by holder type, voting source, and outcome")
  ).toBeVisible();
  await expect(page.getByTestId("vote-matrix-total-registered")).toBeVisible();
  await expect(page.getByTestId("vote-matrix-total-beneficial")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Voting Activity" })
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Beneficial vs. Registered" })
  ).toHaveCount(0);
});

test("source toggles update the total label foreground", async ({ page }) => {
  await page.setViewportSize({ width: 1500, height: 950 });
  await page.goto("/WEN/meeting/wen-special-meeting-2026/tabulation");

  const beneficialTotal = page.getByTestId("vote-matrix-total-beneficial");
  await expect(beneficialTotal).toBeVisible({ timeout: 30_000 });

  const initialFill = await beneficialTotal.getAttribute("data-inside-fill");
  if (initialFill === null) {
    throw new Error("Expected the beneficial total to expose its inside fill");
  }

  await page.getByTestId("source-legend-ivr").click();

  await expect(beneficialTotal).not.toHaveAttribute(
    "data-inside-fill",
    initialFill
  );
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
  await expect(page.getByTestId("vote-matrix-total-beneficial")).toBeVisible({
    timeout: 30_000,
  });

  for (const source of ["web", "print", "ivr"] as const) {
    await page.getByTestId(`source-legend-${source}`).click();
  }

  await expect(page.getByTestId("vote-matrix-total-registered")).toHaveCount(0);
  await expect(page.getByTestId("vote-matrix-total-beneficial")).toHaveCount(0);
  expect(svgErrors).toEqual([]);
});
