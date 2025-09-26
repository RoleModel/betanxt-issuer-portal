import { test, expect, Page, Locator } from '@playwright/test';

const DASHBOARD_URL =
  'http://localhost:3000/WEN/meeting/wen-annual-meeting-2025/dashboard/1';
const DOCUMENTS_URL =
  'http://localhost:3000/WEN/meeting/wen-annual-meeting-2025/documents';

async function navigateToPhase(page: Page) {
  await page.goto(DASHBOARD_URL);
  await page.waitForSelector('[data-testid="meeting-dashboard"]', {
    timeout: 15000,
  });
  await page.waitForSelector('[data-testid*="task-card"]', { timeout: 20000 });
  await page.waitForTimeout(1000);
}

async function openTaskDrawer(taskCard: Locator) {
  await taskCard.click();
  const drawer = taskCard.page().locator('[data-testid="task-drawer"]');
  await expect(drawer).toBeVisible({ timeout: 10000 });
  return drawer;
}

async function closeTaskDrawer(page: Page) {
  const closeButton = page.locator(
    'button:has([data-testid="CloseIcon"]), button:has(svg[data-testid="CloseIcon"])'
  );
  if (await closeButton.isVisible()) {
    await closeButton.click();
    await expect(page.locator('[data-testid="task-drawer"]')).not.toBeVisible({
      timeout: 10000,
    });
  }
}

async function findTaskWithSignForm(page: Page) {
  const cards = page.locator('[data-testid*="task-card"]');
  const count = await cards.count();
  console.log(`Total task cards: ${count}`);
  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    const rawText = (await card.textContent()) || '';
    console.log(
      `Examining task card ${i}: ${rawText.replace(/\s+/g, ' ').trim()}`
    );
    // Quick filter: skip cards already marked Complete
    if (
      /Complete/i.test(rawText) &&
      !/Needs Authorization|Incomplete/i.test(rawText)
    ) {
      continue;
    }
    try {
      const drawer = await openTaskDrawer(card);
      const signFormLink = drawer.locator('text=Sign Form');
      if (await signFormLink.first().isVisible()) {
        const title =
          (await card.locator('[data-testid="task-title"]').textContent()) ||
          rawText.trim();
        return { card, drawer, title: title.trim() };
      }
      await closeTaskDrawer(page);
    } catch (e) {
      console.warn(`Failed opening card index ${i}: ${(e as Error).message}`);
      await closeTaskDrawer(page).catch(() => {});
    }
  }
  throw new Error('No task with a Sign Form link found.');
}

async function completeSignatureFlow(page: Page, drawer: Locator) {
  const signFormLink = drawer.locator('text=Sign Form');
  await expect(signFormLink).toBeVisible({ timeout: 10000 });
  await signFormLink.click();

  const viewer = page.locator('[data-testid="document-viewer"]');
  await expect(viewer).toBeVisible({ timeout: 10000 });

  const signatureArea = viewer.locator('[data-testid*="signature-area"]').first();
  if (await signatureArea.isVisible()) {
    await signatureArea.click();
    const signatureModal = page.locator('[data-testid="signature-modal"]');
    if (await signatureModal.isVisible()) {
      const signaturePad = signatureModal
        .locator('canvas, [data-testid="signature-pad"]')
        .first();
      if (await signaturePad.isVisible()) {
        await signaturePad.click({ position: { x: 50, y: 50 } }).catch(() => {});
      }
      const insertBtn = signatureModal.locator('button:has-text("Insert")');
      if (await insertBtn.isVisible()) {
        await insertBtn.click();
      }
    }
  }

  const submitButton = viewer.locator('button:has-text("Submit")');
  await expect(submitButton).toBeVisible({ timeout: 10000 });
  await submitButton.click();

  await expect(viewer).not.toBeVisible({ timeout: 15000 });
}

test.describe.serial('Signature Task Flow', () => {
  test('should submit a signature task and create document', async ({ page }) => {
    await navigateToPhase(page);

    const { drawer } = await findTaskWithSignForm(page);

    await completeSignatureFlow(page, drawer);

    // Drawer should remain (depends on UX; keep original assumption)
    await expect(drawer).toBeVisible({ timeout: 5000 });

    await closeTaskDrawer(page);

    // Navigate to documents page
    await page.goto(DOCUMENTS_URL);
    await page.waitForSelector('[data-testid="documents-table"]', {
      timeout: 15000,
    });

    const documentsTable = page.locator('[data-testid="documents-table"]');
    await expect(documentsTable).toBeVisible();

    // Look for a row with a likely status (broad regex)
    const newDocumentRow = documentsTable
      .locator('tr')
      .filter({ hasText: /(draft|complete|pending|signed)/i })
      .first();
    await expect(newDocumentRow).toBeVisible({ timeout: 10000 });
  });

  test('should update task status to COMPLETE after submission', async ({ page }) => {
    await navigateToPhase(page);

    const { card, drawer, title } = await findTaskWithSignForm(page);

    await completeSignatureFlow(page, drawer);
    await closeTaskDrawer(page);

    // Refresh task list
    await page.reload();
    await page.waitForSelector('[data-testid*="task-card"]', { timeout: 15000 });

    // Find the same task title again
    const updatedCard = page
      .locator('[data-testid*="task-card"]')
      .filter({ hasText: title })
      .first();

    await expect(updatedCard).toBeVisible({ timeout: 10000 });
    await expect(updatedCard).toContainText(/Complete/i);
  });

  test('Test comments functionality', async ({ page }) => {
    await navigateToPhase(page);

    const { drawer } = await findTaskWithSignForm(page);

    // Open viewer (completeSignatureFlow opens & submits; here we only open)
    const signFormLink = drawer.locator('text=Sign Form');
    await expect(signFormLink).toBeVisible({ timeout: 10000 });
    await signFormLink.click();

    const viewer = page.locator('[data-testid="document-viewer"]');
    await expect(viewer).toBeVisible({ timeout: 10000 });

    // Open comments
    const commentsButton = page.locator('button[aria-label="comments"]');
    await commentsButton.click();
    await expect(page.locator('text=Comments')).toBeVisible({ timeout: 5000 });

    const addCommentButton = page.locator('button:has-text("Add Comment")');
    await addCommentButton.click();

    const commentField = page.locator('textarea[aria-label="Add Comment"]');
    await expect(commentField).toBeVisible();
    await commentField.fill('Test comment from Playwright');

    const submitCommentButton = page.locator(
      'button:has-text("Submit Comment")'
    );
    await submitCommentButton.click();

    await expect(
      page.locator('text=Test comment from Playwright')
    ).toBeVisible({ timeout: 10000 });
  });
});
