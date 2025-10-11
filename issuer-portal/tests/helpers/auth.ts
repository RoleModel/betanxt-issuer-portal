import { Page } from '@playwright/test'

/**
 * Helper function to log in as a specific user
 * @param page - Playwright page object
 * @param user - User to log in as ('mike' | 'lisa' | 'david' | 'jenny')
 */
export async function loginAs(
  page: Page,
  user: 'mike' | 'lisa' | 'david' | 'jenny' = 'mike'
) {
  await page.goto('/login')

  const userButtons = {
    mike: "Login as Mike (Wendy's)",
    lisa: 'Login as Lisa (Paycom)',
    david: 'Login as David (Woodward)',
    jenny: 'Login as Jenny (Enliven)',
  }

  // Click the appropriate login button
  await page.getByRole('button', { name: userButtons[user] }).click()

  // Wait for navigation to dashboard
  await page.waitForURL('**/dashboard')

  // Wait for the app to be fully loaded
  await page.waitForSelector('[data-testid="app-bar"]', { timeout: 10000 })
}

/**
 * Helper function to log out
 * @param page - Playwright page object
 */
export async function logout(page: Page) {
  // Click on the user menu (avatar button)
  const avatarButton = page
    .locator('button')
    .filter({ has: page.locator('.MuiAvatar-root') })
  await avatarButton.click()

  // Click logout in the menu
  await page.getByRole('menuitem', { name: 'Logout' }).click()

  // Wait for redirect to login page
  await page.waitForURL('**/login')
}
