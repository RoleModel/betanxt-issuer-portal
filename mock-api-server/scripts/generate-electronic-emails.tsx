/**
 * Renders the Electronic mailing notice to a PNG snapshot per client, themed
 * with that client's brand colour and name, for the Mailing tab's Electronic
 * thumbnail. Output: issuer-portal/public/mock-mailings/{TICKER}/electronic.png
 *
 * Rendered with @react-email/render, then screenshotted with Playwright (a
 * static PNG is more robust for a thumbnail than a live cross-origin iframe).
 *
 * Run from mock-api-server/: pnpm dlx tsx scripts/generate-electronic-emails.tsx
 */
import { render } from "@react-email/render";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import React from "react";

import { brandConfigs } from "../../issuer-portal/utils/brandConfig";
import { MailingElectronicNotice } from "../emails/MailingElectronicNotice";
import type { MailingElectronicNoticeProps } from "../emails/types";

const OUT_ROOT = path.join(
  process.cwd(),
  "..",
  "issuer-portal",
  "public",
  "mock-mailings"
);

/** Base copy shared across clients; only name and brand colour are swapped. */
function propsForClient(
  companyName: string,
  brandColor: string
): MailingElectronicNoticeProps {
  return {
    companyName,
    companyLegalName: `${companyName}, Inc.`,
    brandColor,
    meetingDateTime: "January 28, 2026 at 8:00 a.m. CT",
    recordDate: "December 1, 2025",
    votingDeadline: "8:00 a.m. CT on Tuesday, January 27, 2026",
    proxyPushUrl: "https://www.proxypush.com",
    proxyPushLabel: "www.proxypush.com",
    voteSiteUrl: "https://www.proxydocs.com",
    controlNumber: "338141742198",
    phone: "1-866-829-5209",
    printedCopiesContactName: "Investor Relations",
    printedCopiesContactEmail: "ir@example.com",
    questionsContactName: "Investor Relations",
    questionsContactLocation: "the U.S.",
    questionsContactEmail: "ir@example.com",
    portalBaseUrl: "http://localhost:3000",
  };
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 600, height: 800 },
    deviceScaleFactor: 2,
  });

  let count = 0;
  for (const config of Object.values(brandConfigs)) {
    const { ticker } = config;
    if (!ticker) continue;

    const html = await render(
      React.createElement(
        MailingElectronicNotice,
        propsForClient(config.companyName, config.primaryColor)
      )
    );

    await page.setContent(html, { waitUntil: "networkidle" });

    const dir = path.join(OUT_ROOT, ticker.toUpperCase());
    fs.mkdirSync(dir, { recursive: true });
    // Viewport (not full-page) screenshot → the top of the notice, which the
    // thumbnail crops to with object-fit: cover / object-position: top.
    await page.screenshot({
      path: path.join(dir, "electronic.png"),
      fullPage: false,
    });
    count++;
  }

  await browser.close();
  console.log(`Wrote ${count} electronic.png snapshots under ${OUT_ROOT}.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
