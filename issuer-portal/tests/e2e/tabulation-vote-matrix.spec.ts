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
