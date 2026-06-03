import { Page, expect, test } from "@playwright/test";

test.describe("Notification System", () => {
  // Helper to handle login
  async function loginToApp(page: Page) {
    // Go to login page
    await page.goto("/login");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Check if we have quick login buttons (development mode)
    const quickLoginButton = page.getByRole("button", { name: /Login as Mike/i });

    if (await quickLoginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Use quick login in development
      await quickLoginButton.click();
    } else {
      // Fall back to auth bypass
      await page.goto("/WEN/dashboard?bypass_auth=true");
    }

    // Wait for dashboard to load
    await page.waitForURL("**/dashboard", { timeout: 10000 });

    // Wait for app bar to be visible
    await page.waitForSelector("header, .MuiAppBar-root", { timeout: 10000 });
  }

  test.beforeEach(async ({ page }) => {
    await loginToApp(page);
  });

  test("should display notification bell", async ({ page }) => {
    // Find notification button - try multiple selectors
    const notificationButton = await page
      .locator("button")
      .filter({
        has: page.locator('svg path[d*="M12"], [data-testid*="Notification"], .MuiBadge-root'),
      })
      .first();

    // Verify button is visible
    await expect(notificationButton).toBeVisible({ timeout: 10000 });
  });

  test("should open notification popover", async ({ page }) => {
    // Find and click notification button
    const notificationButton = await page
      .locator("button")
      .filter({
        has: page.locator('svg path[d*="M12"], [data-testid*="Notification"], .MuiBadge-root'),
      })
      .first();

    await notificationButton.click();

    // Wait for popover
    await page.waitForSelector(".MuiPopover-root", { state: "visible", timeout: 5000 });

    // Verify tabs are visible
    await expect(page.getByRole("tab", { name: /Unread/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /All/i })).toBeVisible();
  });

  test("should display notifications", async ({ page }) => {
    // Open notifications
    const notificationButton = await page
      .locator("button")
      .filter({
        has: page.locator('svg path[d*="M12"], [data-testid*="Notification"], .MuiBadge-root'),
      })
      .first();

    await notificationButton.click();
    await page.waitForSelector(".MuiPopover-root", { state: "visible" });

    // Check for notifications
    const notifications = page.locator('[role="article"]');

    // Wait for at least one notification to load
    await expect(notifications.first()).toBeVisible({ timeout: 5000 });

    // Verify we have notifications
    const count = await notifications.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should navigate when clicking notification", async ({ page }) => {
    // Open notifications
    const notificationButton = await page
      .locator("button")
      .filter({
        has: page.locator('svg path[d*="M12"], [data-testid*="Notification"], .MuiBadge-root'),
      })
      .first();

    await notificationButton.click();
    await page.waitForSelector(".MuiPopover-root", { state: "visible" });

    // Get first notification
    const firstNotification = page.locator('[role="article"]').first();
    await expect(firstNotification).toBeVisible();

    // Get the notification title for logging
    const title = await firstNotification.locator("h6, .MuiTypography-h6").textContent();
    console.log("Clicking notification:", title);

    // Click it
    await firstNotification.click();

    // Wait for navigation
    await page.waitForTimeout(2000);

    // Verify we navigated somewhere
    const currentUrl = page.url();
    expect(currentUrl).toContain("/meeting/");
    console.log("Navigated to:", currentUrl);
  });

  test("should close popover when clicking outside", async ({ page }) => {
    // Open notifications
    const notificationButton = await page
      .locator("button")
      .filter({
        has: page.locator('svg path[d*="M12"], [data-testid*="Notification"], .MuiBadge-root'),
      })
      .first();

    await notificationButton.click();
    await page.waitForSelector(".MuiPopover-root", { state: "visible" });

    // Click outside
    await page.locator("body").click({ position: { x: 10, y: 10 } });

    // Wait for animation
    await page.waitForTimeout(500);

    // Verify popover is hidden
    await expect(page.locator(".MuiPopover-root")).toBeHidden();
  });

  test("should mark notification as read", async ({ page }) => {
    // Open notifications
    const notificationButton = await page
      .locator("button")
      .filter({
        has: page.locator('svg path[d*="M12"], [data-testid*="Notification"], .MuiBadge-root'),
      })
      .first();

    await notificationButton.click();
    await page.waitForSelector(".MuiPopover-root", { state: "visible" });

    // Get unread tab and count
    const unreadTab = page.getByRole("tab", { name: /Unread/i });
    const initialText = await unreadTab.textContent();
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || "0");

    if (initialCount > 0) {
      // Click first unread notification
      const firstNotification = page.locator('[role="article"]').first();
      await firstNotification.click();

      // Wait for navigation and go back
      await page.waitForTimeout(2000);
      await page.goBack();

      // Open notifications again
      await page.waitForSelector("header, .MuiAppBar-root", { timeout: 10000 });
      await notificationButton.click();
      await page.waitForSelector(".MuiPopover-root", { state: "visible" });

      // Check new count
      const newText = await unreadTab.textContent();
      const newCount = parseInt(newText?.match(/\d+/)?.[0] || "0");

      // Should have one less unread
      expect(newCount).toBeLessThan(initialCount);
    } else {
      console.log("No unread notifications to test");
    }
  });
});
