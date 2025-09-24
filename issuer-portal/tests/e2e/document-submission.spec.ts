import { test, expect } from '@playwright/test';

test('should submit a signature task and create document', async ({ page }) => {
  // Start directly from the phase dashboard using absolute URL
  await page.goto('http://localhost:3000/WEN/meeting/wen-annual-meeting-2025/dashboard/1')

  // Wait for the meeting dashboard container to load
  await page.waitForSelector('[data-testid="meeting-dashboard"]', { timeout: 10000 })

  // Wait for tasks to actually load by waiting for at least one task card
  await page.waitForSelector('[data-testid*="task-card"]', { timeout: 15000 })

  // Give a short buffer for all tasks to load
  await page.waitForTimeout(2000)

  // Debug: Log all task cards found
  const allTasks = await page.locator('[data-testid*="task-card"]').all()
  console.log(`Found ${allTasks.length} task cards`)

  for (const task of allTasks) {
    const text = await task.textContent()
    console.log(`Task: ${text}`)
  }

  // Step 1: Click on the Broadridge/ICS Access task specifically
  const broadridgeTask = page.locator('[data-testid*="task-card"]').filter({ hasText: 'Broadridge/ICS Access' })
  await expect(broadridgeTask).toBeVisible({ timeout: 10000 })

  // Check if the task is clickable (not disabled)
  const isDisabled = await broadridgeTask.locator('button').first().isDisabled().catch(() => false)
  console.log(`Broadridge task disabled: ${isDisabled}`)

  await broadridgeTask.click()

  // Step 2: Wait for TaskDrawer to open
  const taskDrawer = page.locator('[data-testid="task-drawer"]')
  await expect(taskDrawer).toBeVisible({ timeout: 5000 })

  // Step 3: Click "Sign Form" link in TaskDrawer to open DocumentViewer
  const signFormLink = taskDrawer.locator('text="Sign Form"')
  await expect(signFormLink).toBeVisible({ timeout: 5000 })
  await signFormLink.click()

  // Step 4: Wait for DocumentViewer to open
  const documentViewer = page.locator('[data-testid="document-viewer"]')
  await expect(documentViewer).toBeVisible({ timeout: 5000 })

  // Step 5: Handle signature workflow in DocumentViewer
  const signatureArea = documentViewer.locator('[data-testid*="signature-area"]').first()
  if (await signatureArea.isVisible()) {
    await signatureArea.click()

    // Handle signature modal if it appears
    const signatureModal = page.locator('[data-testid="signature-modal"]')
    if (await signatureModal.isVisible()) {
      // Click the signature pad or draw area
      const signaturePad = signatureModal.locator('canvas, [data-testid="signature-pad"]').first()
      await signaturePad.click({ position: { x: 50, y: 50 } })

      // Submit the signature
      await signatureModal.locator('button:has-text("Insert")').click()
    }
  }

  // Step 6: Submit in DocumentViewer
  const documentSubmitButton = documentViewer.locator('button:has-text("Submit")')
  await expect(documentSubmitButton).toBeVisible()
  await documentSubmitButton.click()

  // Step 7: DocumentViewer should close after submission
  await expect(documentViewer).not.toBeVisible({ timeout: 5000 })

  // Step 8: TaskDrawer should still be visible but task should be marked complete
  await expect(taskDrawer).toBeVisible()

  // Step 9: Close TaskDrawer using the close button
  const closeButton = taskDrawer.locator('button:has([data-testid="CloseIcon"]), button:has(svg[data-testid="CloseIcon"])')
  await expect(closeButton).toBeVisible()
  await closeButton.click()
  await expect(taskDrawer).not.toBeVisible({ timeout: 5000 })

  // Step 10: Navigate to documents page to verify document was created
  await page.goto('http://localhost:3000/WEN/meeting/wen-annual-meeting-2025/documents')
  await page.waitForSelector('[data-testid="documents-table"]', { timeout: 10000 })

  // Step 11: Verify document appears in table
  const documentsTable = page.locator('[data-testid="documents-table"]')
  await expect(documentsTable).toBeVisible()

  // Look for a document with appropriate status
  const newDocument = documentsTable.locator('tr').filter({ hasText: /draft|completed|pending/i })
  await expect(newDocument).toBeVisible({ timeout: 5000 })
})

test('should update task status to COMPLETE after submission', async ({ page }) => {
  // Find the Broadridge task and click it to open the drawer
  const broadridgeTask = page.locator('[data-testid*="task-card"]').filter({ hasText: 'Broadridge/ICS Access' })

  // Get the task title to track it
  const taskTitle = await broadridgeTask.locator('[data-testid="task-title"]').textContent()

  await broadridgeTask.click()
  const taskDrawer = page.locator('[data-testid="task-drawer"]')
  await expect(taskDrawer).toBeVisible({ timeout: 5000 })

  // Click Sign Form to open DocumentViewer
  const signFormLink = taskDrawer.locator('text="Sign Form"')
  await expect(signFormLink).toBeVisible({ timeout: 5000 })
  await signFormLink.click()

  // Wait for DocumentViewer to open
  const documentViewer = page.locator('[data-testid="document-viewer"]')
  await expect(documentViewer).toBeVisible({ timeout: 5000 })

  // Submit the document
  const submitButton = documentViewer.locator('button:has-text("Submit")')
  await expect(submitButton).toBeVisible()
  await submitButton.click()

  // Wait for DocumentViewer to close
  await expect(documentViewer).not.toBeVisible({ timeout: 5000 })

  // Close the TaskDrawer
  const closeButton = taskDrawer.locator('button:has([data-testid="CloseIcon"]), button:has(svg[data-testid="CloseIcon"])')
  await expect(closeButton).toBeVisible()
  await closeButton.click()
  await expect(taskDrawer).not.toBeVisible({ timeout: 5000 })

  // Wait a bit for the status to update
  await page.waitForTimeout(1000)

  // Check that the task is now marked as complete
  const completedTask = page.locator('[data-testid*="task-card"]')
    .filter({ hasText: taskTitle || '' })
    .first()

  // Task should have completed status (COMPLETE maps to "Complete" in StatusChip)
  await expect(completedTask).toContainText('Complete')
})

test('Test comments functionality', async ({ page }) => {
  // Find the Broadridge task and open it
  const broadridgeTask = page.locator('[data-testid*="task-card"]').filter({ hasText: 'Broadridge/ICS Access' })
  await broadridgeTask.click()
  await page.waitForSelector('[data-testid="task-drawer"]', { timeout: 5000 })

  // Open the document viewer via Sign Form link
  const signFormLink = page.locator('text="Sign Form"')
  if (await signFormLink.isVisible()) {
    await signFormLink.click()
    await page.waitForSelector('[data-testid="document-viewer"]', { timeout: 5000 })

    // Click comments button
    const commentsButton = page.locator('button[aria-label="comments"]')
    await commentsButton.click()

    // Comments panel should be visible
    await expect(page.locator('text="Comments"')).toBeVisible()

    // Click Add Comment
    const addCommentButton = page.locator('button:has-text("Add Comment")')
    await addCommentButton.click()

    // Comment field should appear
    const commentField = page.locator('textarea[aria-label="Add Comment"]')
    await expect(commentField).toBeVisible()

    // Type a comment
    await commentField.fill('Test comment from Playwright')

    // Submit comment
    const submitCommentButton = page.locator('button:has-text("Submit Comment")')
    await submitCommentButton.click()

    // Comment should appear in the list
    await expect(page.locator('text="Test comment from Playwright"')).toBeVisible()
  }
});