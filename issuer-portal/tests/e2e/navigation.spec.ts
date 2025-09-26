// Basic navigation smoke test to ensure the Next.js app boots.
import { expect, test } from '@playwright/test'

// Adjust path if a default clientTicker landing page differs.
// Using root '/' which should redirect or render a landing/shell.
test('root page renders without error', async ({ page }) => {
  await page.goto('/')
  // Expect at least <body> to contain some app root element.
  const body = page.locator('body')
  await expect(body).toBeVisible()
})
