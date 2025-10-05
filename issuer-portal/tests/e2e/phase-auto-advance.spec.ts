import { test, expect } from '@playwright/test'

test.describe('Phase Auto-Advance', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await page.goto('/login')
    await page.fill('input[id*="username" i]', 'devuser')
    await page.fill('input[type="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')

    // Navigate to Wendy's meeting
    await page.goto('/WEN/meeting/wen-annual-meeting-2026/dashboard/1')
  })

  test('should automatically advance from Phase 1 to Phase 2 when all tasks complete', async ({ page }) => {
    // Wait for Phase 1 dashboard to load - look for "Tasks - Phase 1" header
    await expect(page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: /Tasks.*Phase 1/i })).toBeVisible()

    // Get all task cards - they have data-testid="task-card-{taskId}"
    const taskCards = page.locator('[data-testid^="task-card-"]')
    const taskCount = await taskCards.count()
    console.log(`Found ${taskCount} task cards in Phase 1`)

    if (taskCount === 0) {
      console.log('No task cards found - checking for alternative selectors')
      // Fallback: look for clickable cards with task-related classes
      const alternativeCards = page.locator('.MuiCard-root').filter({ hasText: /DTCC|Proxy|Plan File|Transfer Agent|Broadridge/i })
      const altCount = await alternativeCards.count()
      console.log(`Found ${altCount} alternative task cards`)
    }

    // Complete all tasks by clicking each task card and submitting
    for (let i = 0; i < taskCount; i++) {
      const taskCard = taskCards.nth(i)

      // Get task info for debugging
      const taskText = await taskCard.textContent()
      console.log(`Processing task ${i + 1}: ${taskText?.substring(0, 50)}...`)

      // Click task card to open TaskDrawer (click the CardActionArea)
      await taskCard.locator('.MuiCardActionArea-root').click()

      // Wait for TaskDrawer to open
      await expect(page.locator('[data-testid="task-drawer"]')).toBeVisible({ timeout: 5000 })

      // Look for task completion methods in the drawer
      const submitButton = page.locator('[data-testid="task-drawer"] button').filter({ hasText: /submit/i }).first()
      const dtccCheckbox = page.locator('[data-testid="task-drawer"] input[type="checkbox"]').first()

      // Try different completion methods based on task type
      if (await dtccCheckbox.isVisible()) {
        console.log('Found DTCC checkbox - checking it')
        await dtccCheckbox.check()
        await page.waitForTimeout(2000) // Wait for auto-close after DTCC authorization
      } else if (await submitButton.isVisible()) {
        console.log('Found submit button - clicking it')
        await submitButton.click()
        await page.waitForTimeout(2000)
      } else {
        console.log('No completion method found - closing drawer')
        // Close drawer using the close button in header
        await page.locator('[data-testid="task-drawer"] button').first().click()
      }

      // Wait for drawer to close
      await expect(page.locator('[data-testid="task-drawer"]')).not.toBeVisible({ timeout: 5000 })

      // Small delay between tasks
      await page.waitForTimeout(1000)
    }

    // After completing all tasks, expect auto-advance to Phase 2
    // Look for the success notification first (MUI Snackbar with Alert)
    await expect(page.locator('.MuiSnackbar-root [role="alert"]').filter({
      hasText: /Phase 1 Wrapped Up|Time for Phase 2/i
    })).toBeVisible({ timeout: 10000 })

    // Then expect navigation to Phase 2 (with longer timeout for the 3-second delay)
    await expect(page).toHaveURL(/dashboard\/2$/, { timeout: 20000 })

    // Verify we're on Phase 2
    await expect(page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: /Tasks.*Phase 2/i })).toBeVisible()
  })

  test('should NOT auto-advance if tasks are incomplete', async ({ page }) => {
    // Wait for Phase 1 dashboard to load
    await expect(page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: /Tasks.*Phase 1/i })).toBeVisible()

    // Get all tasks
    const taskCards = page.locator('[data-testid^="task-card-"]')
    const taskCount = await taskCards.count()

    // Complete all but one task
    if (taskCount > 1) {
      for (let i = 0; i < taskCount - 1; i++) {
        const taskCard = taskCards.nth(i)
        await taskCard.locator('.MuiCardActionArea-root').click()

        await expect(page.locator('[data-testid="task-drawer"]')).toBeVisible()

        const submitButton = page.locator('[data-testid="task-drawer"] button').filter({ hasText: /submit/i }).first()
        const dtccCheckbox = page.locator('[data-testid="task-drawer"] input[type="checkbox"]').first()

        if (await dtccCheckbox.isVisible()) {
          await dtccCheckbox.check()
          await page.waitForTimeout(2000)
        } else if (await submitButton.isVisible()) {
          await submitButton.click()
          await page.waitForTimeout(2000)
        } else {
          await page.locator('[data-testid="task-drawer"] button').first().click()
        }

        await expect(page.locator('[data-testid="task-drawer"]')).not.toBeVisible({ timeout: 5000 })
        await page.waitForTimeout(500)
      }
    }

    // Wait a few seconds
    await page.waitForTimeout(3000)

    // Verify we're still on Phase 1
    await expect(page).toHaveURL(/dashboard\/1$/)

    // Should show indication of remaining tasks
    const incompleteTask = taskCards.last()
    await expect(incompleteTask).toBeVisible()
  })

  test('should show clear indication when ready to advance', async ({ page }) => {
    // Complete all tasks
    const taskCards = page.locator('[data-testid^="task-card-"]')
    const taskCount = await taskCards.count()

    for (let i = 0; i < taskCount; i++) {
      const taskCard = taskCards.nth(i)
      await taskCard.click()

      await expect(page.locator('[data-testid="task-drawer"]')).toBeVisible()

      const submitButton = page.locator('button').first()
      if (await submitButton.isVisible()) {
        await submitButton.click()
        await page.waitForTimeout(300)
      }

      await expect(page.locator('[data-testid="task-drawer"]')).not.toBeVisible({ timeout: 3000 })
    }

    // Should show ready indicator or success notification
    const readyIndicator = page.locator('[data-testid="phase-ready-indicator"], [role="alert"]')
    await expect(readyIndicator.first()).toBeVisible({ timeout: 5000 })
  })

  test('should prevent manual advance when tasks incomplete', async ({ page }) => {
    // Try to find and click advance button
    const advanceButton = page.locator('button').filter({ hasText: /next phase|advance|phase 2/i }).first()

    if (await advanceButton.isVisible()) {
      await advanceButton.click()

      // Should show error message
      await expect(page.locator('[role="alert"], .error-message').filter({
        hasText: /incomplete|remaining|must complete/i
      })).toBeVisible({ timeout: 3000 })

      // Should still be on Phase 1
      await expect(page).toHaveURL(/dashboard\/1$/)
    }
  })
})
