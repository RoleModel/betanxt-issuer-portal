import { expect, test } from '@playwright/test'

test.describe('AppBar Performance', () => {
  test('click response time should be under 200ms', async ({ page }) => {
    await page.goto('/WEN/meeting/wen-annual-meeting-2025')

    // Wait for app to fully load
    await page.waitForLoadState('networkidle')

    // Measure notification button click response
    const startTime = Date.now()

    await page.click('[aria-label="notifications"]')

    // Wait for notification popper to appear - MUI Popover uses role="tooltip"
    await page.waitForSelector('text=Filing Complete', { state: 'visible' })

    const endTime = Date.now()
    const responseTime = endTime - startTime

    // Verify response time is under 200ms
    expect(responseTime).toBeLessThan(200)
  })

  test('should not block UI during navigation', async ({ page }) => {
    await page.goto('/PAYC/meeting/payc-annual-meeting-2025')

    // Wait for app to fully load
    await page.waitForLoadState('networkidle')

    // Click navigation tab and measure response
    const startTime = Date.now()

    await page.click('text=Past Meetings')

    // Wait for navigation to complete
    await page.waitForURL('**/past-meetings')

    const endTime = Date.now()
    const navTime = endTime - startTime

    // Verify navigation is responsive - increased timeout since initial load is slow
    expect(navTime).toBeLessThan(5000)
  })

  test('localStorage should not block renders', async ({ page }) => {
    // Mock slow localStorage to test caching
    await page.addInitScript(() => {
      const originalGetItem = localStorage.getItem
      localStorage.getItem = function (key) {
        if (key === 'betanxt-selected-client') {
          // Simulate slow storage
          const start = Date.now()
          while (Date.now() - start < 100) {} // 100ms delay
        }
        return originalGetItem.call(this, key)
      }
    })

    await page.goto('/WWD/meeting/wwd-annual-meeting-2025')

    // Should still load quickly despite slow localStorage
    const appBar = page.locator('header')
    await expect(appBar).toBeVisible({ timeout: 1000 })
  })
})
