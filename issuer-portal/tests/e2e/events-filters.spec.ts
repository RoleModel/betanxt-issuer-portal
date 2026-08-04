import { expect, test } from "@playwright/test";

test("events toolbar searches, displays active filters, and saves a filter group", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1500, height: 950 });
  await page.goto("/events");
  await expect(page.getByRole("grid")).toBeVisible({ timeout: 30_000 });

  await page
    .getByRole("button", { name: /filter/i })
    .first()
    .click();

  const panel = page.locator(".MuiDataGrid-panel");
  await panel.getByLabel("Value").first().fill("Wendy");
  await panel.getByRole("button", { name: "Add filter", exact: true }).click();
  await expect(panel.locator(".MuiDataGrid-filterForm")).toHaveCount(2);
  await panel.getByLabel("Value").nth(1).fill("Company");
  await expect(
    page.getByText("Save these 2 filters as a reusable group")
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /client contains wendy/i })
  ).toBeVisible();

  await panel.getByLabel("Group name").fill("Wendy events");
  await panel
    .getByRole("button", { name: "Save filters", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Wendy events" })
  ).toBeVisible();

  await page.getByRole("button", { name: "Search" }).click();
  const search = page.getByRole("searchbox", { name: /search/i });
  await search.fill("Wendy");
  await expect(search).toHaveValue("Wendy");
});

test("events search includes past events without showing them by default", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1500, height: 950 });
  await page.goto("/events");
  await expect(page.getByRole("grid")).toBeVisible({ timeout: 30_000 });

  const pastEventDate = page.getByRole("gridcell", {
    name: "5/1/2025",
  });
  await expect(pastEventDate).toHaveCount(0);

  await page.getByRole("button", { name: "Search" }).click();
  await page.getByRole("searchbox", { name: /search/i }).fill("VAPO");

  await expect(pastEventDate).toBeVisible();
});
