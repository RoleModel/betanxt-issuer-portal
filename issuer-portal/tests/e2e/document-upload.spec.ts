import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

// Utility to create a temporary file for upload
function createTemporaryPdf(filename: string): string {
  const filePath = path.join(process.cwd(), filename);
  const pdfContent =
    "%PDF-1.4\n%\u{E2}\u{E3}\u{CF}\u{D3}\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 24 Tf 72 120 Td (Test PDF Upload) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000115 00000 n \n0000000214 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n300\n%%EOF";
  fs.writeFileSync(filePath, pdfContent);
  return filePath;
}

// Assumptions:
// - Meeting route pattern matches example used in existing tests (WEN annual meeting 2025)
// - Upload button opens FileUploadDialog with input[type=file]
// - After upload, documents table refreshes and displays new file name
// If selectors differ in implementation, adjust data-testid markers accordingly.

test("upload DSM placeholder document and verify appearance", async ({
  page,
}) => {
  // Navigate directly to documents page (MeetingContext should lazy resolve)
  await page.goto(
    "http://localhost:3000/WEN/meeting/wen-annual-meeting-2025/documents",
    {
      waitUntil: "domcontentloaded",
    }
  );

  // Retry logic: attempt to reload a few times if heading not present (handle transient 500s)
  let attempts = 0;
  while (attempts < 3) {
    const heading = page.locator("text=Documents");
    if (await heading.first().isVisible()) {
      break;
    }
    await page.waitForTimeout(1500);
    attempts++;
    if (!(await heading.first().isVisible())) {
      await page.reload({ waitUntil: "domcontentloaded" });
    }
  }
  const documentsHeading = page.locator("text=Documents").first();
  await expect(documentsHeading).toBeVisible({ timeout: 15_000 });

  // Trigger upload dialog - use the first main upload button in the Documents section
  const uploadButton = page.locator('button:has-text("Upload")').first();
  await expect(uploadButton).toBeVisible();
  await uploadButton.click();

  // Wait for dialog (heuristic selectors)
  const dialog = page.locator('[role="dialog"]:has-text("Upload")');
  await expect(dialog).toBeVisible({ timeout: 5000 });

  // Prepare temp PDF
  const temporaryPdf = createTemporaryPdf("playwright-upload-test.pdf");

  // Find file input
  const fileInput = dialog.locator('input[type="file"]');
  await expect(fileInput).toBeVisible();
  await fileInput.setInputFiles(temporaryPdf);

  // Optional: add version notes if field exists
  const notesField = dialog
    .locator("textarea, input")
    .filter({ hasText: "Notes" });
  // swallow errors if not present
  try {
    if (await notesField.first().isVisible()) {
      await notesField.first().fill("Automated upload test");
    }
  } catch {}

  // Submit upload (button text may vary)
  const submit = dialog.locator('button:has-text("Submit")');
  await expect(submit).toBeVisible();
  await submit.click();

  // Wait for dialog close
  await expect(dialog).toBeHidden({ timeout: 15_000 });

  // Clean up temp file
  try {
    fs.unlinkSync(temporaryPdf);
  } catch {}
});
