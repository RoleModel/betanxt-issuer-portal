/**
 * Generates mock follow-up proxy-mailing PDFs for the Additional Mailing Summary
 * prototype, styled after the Figma "Notice of Internet Availability of Proxy
 * Materials" design and themed with each client's brand colors.
 *
 * Output: issuer-portal/public/mock-mailings/*.pdf
 * Run: npx tsx scripts/generate-mock-mailing-pdfs.ts
 */
import { jsPDF } from "jspdf";
import fs from "node:fs";
import path from "node:path";

import { brandConfigs } from "../utils/brandConfig";
import { loadHeaderLogoForBrand, loadLogoForBrand, type RasterizedLogo } from "./mailing-pdf-logo";

type RGB = [number, number, number];

const hexToRgb = (hex: string): RGB => {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

/** Pick black or white text for legibility on a given background. */
const contrastText = ([r, g, b]: RGB): RGB =>
  (r * 299 + g * 587 + b * 114) / 1000 > 150 ? [17, 17, 17] : [255, 255, 255];

interface ClientTheme {
  companyName: string;
  ticker: string;
  logo: RasterizedLogo | null;
  headerLogo: RasterizedLogo | null;
  primaryColor: string; // banner + headings
  secondaryColor: string; // accent bars + contact values
  address: string[];
  voteSiteCode: string; // e.g. IBHK
  phone: string;
}

interface MailingJob {
  file: string;
  jobName: string;
  meetingType: string;
  meetingDateLine: string;
  meetingLocation: string;
  recordDateLine: string;
  /** "proxy" → themed Notice of Internet Availability card; "generic" → dark-header doc */
  layout: "proxy" | "generic";
  /** Generic-layout body copy */
  body?: string[];
}

// Build the per-client follow-up jobs. Colors/logo come from each client's brand
// config; meeting/recipient copy is generic placeholder data for the prototype.
function buildJobs(fullName: string): MailingJob[] {
  return [
    {
      // Proxy card → themed Notice of Internet Availability design
      file: "fw1-reminder-unvoted.pdf",
      jobName: "FW1 — Proxy Card (Reminder, Unvoted)",
      meetingType: "Annual Meeting of Shareholders",
      meetingDateLine: "Monday, April 6, 2026  8:30 AM, EST",
      meetingLocation: "Three Limited Parkway, Columbus, Ohio 43230",
      recordDateLine: "For Shareholders of record as of January 2, 2026",
      layout: "proxy",
    },
    {
      // Non-proxy document → generic dark-header layout
      file: "fw2-supplemental-proxy.pdf",
      jobName: "FW2 — Supplemental Proxy Material",
      meetingType: "Annual Meeting of Shareholders",
      meetingDateLine: "Monday, April 6, 2026  8:30 AM, EST",
      meetingLocation: "Three Limited Parkway, Columbus, Ohio 43230",
      recordDateLine: "For Shareholders of record as of January 2, 2026",
      layout: "generic",
      body: [
        "SUPPLEMENTAL PROXY MATERIALS",
        "",
        `The Board of Directors of ${fullName} is providing these supplemental materials to`,
        "shareholders of record as of the record date. They contain additional information",
        "regarding the proposals to be voted on at the meeting that was not available at the",
        "time of the original mailing.",
        "",
        "Please review this supplement together with the proxy statement previously delivered to",
        "you. No action is required if you do not wish to change your previously submitted vote.",
      ],
    },
    {
      // Non-proxy document → generic dark-header layout
      file: "fw3-second-reminder-retail.pdf",
      jobName: "FW3 — Shareholder Letter (Retail)",
      meetingType: "Annual Meeting of Shareholders",
      meetingDateLine: "Monday, April 6, 2026  8:30 AM, EST",
      meetingLocation: "Three Limited Parkway, Columbus, Ohio 43230",
      recordDateLine: "For Shareholders of record as of January 2, 2026",
      layout: "generic",
      body: [
        "Dear Shareholder,",
        "",
        `Our records indicate your ${fullName} shares have not yet been voted for the upcoming`,
        "meeting. Your vote is important regardless of the number of shares you own.",
        "",
        "Voting takes only a few minutes — vote online, by phone, or by returning the enclosed",
        "proxy card. Have your control number ready.",
        "",
        "Thank you for being a valued shareholder.",
      ],
    },
  ];
}

const outRoot = path.join(process.cwd(), "public", "mock-mailings");
fs.mkdirSync(outRoot, { recursive: true });

function renderNotice(doc: jsPDF, client: ClientTheme, job: MailingJob) {
  const primary = hexToRgb(client.primaryColor);
  const secondary = hexToRgb(client.secondaryColor);
  const bannerText = contrastText(primary);
  const ink: RGB = [40, 44, 70];

  const W = doc.internal.pageSize.getWidth();
  const margin = 48;

  // Outer frame
  doc.setDrawColor(40, 44, 70);
  doc.setLineWidth(2);
  doc.rect(16, 16, W - 32, doc.internal.pageSize.getHeight() - 32);

  // --- Header: logo OR company name + address (left) ---
  const logo = client.logo;
  let addressX = margin;
  let addressY = 74;

  if (logo) {
    const logoH = 34;
    const logoW = logoH * logo.aspect;
    doc.addImage(logo.dataUri, "PNG", margin, 40, logoW, logoH);
    addressY = 40 + logoH + 8;
  } else {
    doc.setFillColor(...primary);
    doc.circle(margin + 8, 58, 8, "F");
    addressX = margin + 24;
    doc.setTextColor(...ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(client.companyName, addressX, 60);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  client.address.forEach((line, i) => doc.text(line, addressX, addressY + i * 11));

  // --- QR placeholder (right) ---
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(8);
  doc.text("Scan code for mobile voting", W - margin - 120, 50);
  drawQr(doc, W - margin - 56, 56, 50);

  // --- Important notice line ---
  let y = 130;
  doc.setTextColor(...primary);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(
    `Important Notice Regarding the Availability of Proxy Materials for ${client.companyName}`,
    W / 2,
    y,
    { align: "center" },
  );

  // --- Banner (solid, full content width) ---
  y += 14;
  const contentW = W - margin * 2;
  doc.setFillColor(...primary);
  doc.rect(margin, y, contentW, 32, "F");
  doc.setTextColor(...bannerText);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(job.meetingType, W / 2, y + 22, { align: "center" });

  // --- Meeting details ---
  y += 52;
  doc.setTextColor(...primary);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(job.meetingDateLine, W / 2, y, { align: "center" });
  y += 16;
  doc.text(job.meetingLocation, W / 2, y, { align: "center" });
  y += 14;
  doc.setFontSize(8.5);
  doc.setTextColor(110, 110, 110);
  doc.text(job.recordDateLine, W / 2, y, { align: "center" });

  // --- Recipient address + Intelligent Mail barcode (left) ---
  y += 28;
  doc.setTextColor(...ink);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  ["Voter Name", "186 Fleet Street", "London, NY 12345"].forEach((line, i) =>
    doc.text(line, margin, y + i * 12),
  );
  drawBarcode(doc, margin, y + 40, 150, 16);

  // --- "Your vote matters!" filled panel (left) ---
  const panelY = y + 70;
  const panelW = contentW * 0.56;
  const panelH = 108;
  doc.setFillColor(...primary);
  doc.rect(margin, panelY, panelW, panelH, "F");
  // checkbox (secondary outline + check)
  const cbX = margin + 16;
  const cbY = panelY + 30;
  doc.setDrawColor(...secondary);
  doc.setLineWidth(3.5);
  doc.rect(cbX, cbY, 44, 44);
  doc.setLineWidth(3);
  doc.line(cbX + 8, cbY + 8, cbX + 36, cbY + 36);
  doc.line(cbX + 36, cbY + 8, cbX + 8, cbY + 36);
  // headline (white)
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("Your vote", cbX + 60, panelY + 40);
  doc.text("matters!", cbX + 60, panelY + 66);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("To order paper materials, use one", cbX + 60, panelY + 84);
  doc.text("of the following methods:", cbX + 60, panelY + 95);

  // --- Contacts column (right of panel) ---
  const cx = margin + panelW + 24;
  let cy = panelY + 10;
  const contact = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...primary);
    doc.text(label, cx, cy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...secondary);
    doc.text(value, cx, cy + 13);
    cy += 30;
  };
  contact("Internet:", `investorelections.com/${client.voteSiteCode}`);
  contact("Call:", client.phone);
  contact("Email:", "paper@investorelections.com");

  // control number box (under contacts)
  doc.setDrawColor(...ink);
  doc.setLineWidth(1);
  const boxW = W - margin - cx;
  doc.rect(cx, cy, boxW, 22);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...ink);
  doc.text("8796439-8453", cx + boxW / 2, cy + 15, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(130, 130, 130);
  doc.text("Your control number", cx, cy - 3);
  doc.text("Have the 12 digit control number located in the box above", cx, cy + 32, {
    maxWidth: boxW,
  });

  // --- Body text (clear of the panel and the control-number helper text) ---
  y = panelY + panelH + 52;
  doc.setTextColor(...primary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(
    `For a convenient way to view proxy materials and VOTE go to www.proxypush.com/${client.voteSiteCode}`,
    margin,
    y,
  );
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  const body = [
    "Vote in Person: Please review meeting materials for meeting attendance requirements and directions to the meeting.",
    "This communication presents only an overview of the more complete proxy materials that are available to you on the Internet.",
    "This is not a ballot. You cannot use this notice to vote your shares. We encourage you to access and review all of the",
    "important information contained in the proxy materials before voting.",
  ];
  body.forEach((line) => {
    doc.text(line, margin, y, { maxWidth: contentW });
    y += 14;
  });
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primary);
  doc.text("SEE REVERSE FOR FULL AGENDA", margin, y);
  doc.setLineWidth(0.8);
  doc.line(margin, y + 2, margin + 150, y + 2);

  // --- Perforation line near bottom ---
  const perfY = doc.internal.pageSize.getHeight() - 44;
  doc.setLineDashPattern([3, 3], 0);
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.8);
  doc.line(28, perfY, W - 28, perfY);
  doc.setLineDashPattern([], 0);
}

/** Draw a faux Intelligent Mail barcode (variable-height vertical bars). */
function drawBarcode(doc: jsPDF, x: number, y: number, width: number, height: number) {
  doc.setFillColor(0, 0, 0);
  const bars = 65;
  const gap = width / bars;
  for (let i = 0; i < bars; i++) {
    const mode = (i * 7 + 3) % 4; // 0..3 → full / ascender / descender / tracker
    let by = y;
    let bh = height;
    if (mode === 1) {
      bh = height * 0.6;
    } else if (mode === 2) {
      by = y + height * 0.4;
      bh = height * 0.6;
    } else if (mode === 3) {
      by = y + height * 0.35;
      bh = height * 0.3;
    }
    doc.rect(x + i * gap, by, gap * 0.5, bh, "F");
  }
}

/** Draw a deterministic faux-QR block (white bg, black modules + corner finders). */
function drawQr(doc: jsPDF, x: number, y: number, size: number) {
  const cells = 11;
  const c = size / cells;
  // white background
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, size, size, "F");
  doc.setFillColor(0, 0, 0);

  // deterministic module pattern
  for (let r = 0; r < cells; r++) {
    for (let col = 0; col < cells; col++) {
      if ((r * 7 + col * 5 + r * col) % 3 === 0) {
        doc.rect(x + col * c, y + r * c, c, c, "F");
      }
    }
  }

  // corner finder patterns (3x3 with hollow center)
  const finder = (fx: number, fy: number) => {
    doc.setFillColor(0, 0, 0);
    doc.rect(fx, fy, c * 3, c * 3, "F");
    doc.setFillColor(255, 255, 255);
    doc.rect(fx + c * 0.6, fy + c * 0.6, c * 1.8, c * 1.8, "F");
    doc.setFillColor(0, 0, 0);
    doc.rect(fx + c, fy + c, c, c, "F");
  };
  finder(x, y);
  finder(x + size - c * 3, y);
  finder(x, y + size - c * 3);
}

/** Generic dark-header document layout for non-proxy-card mailings. */
function renderGeneric(doc: jsPDF, client: ClientTheme, job: MailingJob) {
  const primary = hexToRgb(client.primaryColor);
  const headerText = contrastText(primary);
  const W = doc.internal.pageSize.getWidth();
  const margin = 56;

  // Header bar themed with the client primary color
  doc.setFillColor(...primary);
  doc.rect(0, 0, W, 84, "F");

  // Header: light logo on primary bar (meeting type beside/below)
  const logo = client.headerLogo;
  let meetingX = margin;
  let meetingY = 60;

  doc.setTextColor(...headerText);

  if (logo) {
    const h = 40;
    const w = h * logo.aspect;
    doc.addImage(logo.dataUri, "PNG", margin, 22, w, h);
    meetingX = margin + w + 14;
    meetingY = 50;
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(client.companyName, margin, 42);
    meetingY = 60;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(job.meetingType, meetingX, meetingY);

  // Job title
  let y = 124;
  doc.setTextColor(40, 44, 70);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(job.jobName, margin, y);
  // secondary accent rule
  doc.setDrawColor(...hexToRgb(client.secondaryColor));
  doc.setLineWidth(3);
  doc.line(margin, y + 8, margin + 120, y + 8);

  y += 34;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(55, 55, 55);
  (job.body ?? []).forEach((line) => {
    doc.text(line, margin, y, { maxWidth: W - margin * 2 });
    y += 17;
  });

  // Meeting reference footer block
  y += 16;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(1);
  doc.line(margin, y, W - margin, y);
  y += 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...primary);
  doc.text(job.meetingType, margin, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 90, 90);
  doc.text(job.meetingDateLine, margin, y + 14);
  doc.text(job.meetingLocation, margin, y + 28);
  doc.text(job.recordDateLine, margin, y + 42);
}

function renderJob(client: ClientTheme, job: MailingJob): Uint8Array {
  const doc = new jsPDF({ unit: "pt", format: "letter" });

  if (job.layout === "proxy") {
    renderNotice(doc, client, job);

    // Page 2 — full agenda / reverse (proxy card only)
    doc.addPage();
    const W = doc.internal.pageSize.getWidth();
    const primary = hexToRgb(client.primaryColor);
    doc.setFillColor(...primary);
    doc.rect(0, 0, W, 56, "F");
    doc.setTextColor(...contrastText(primary));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("Full Meeting Agenda", 48, 35);
    doc.setTextColor(40, 44, 70);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    let y = 96;
    [
      "1. Election of Directors",
      "2. Advisory Vote on Executive Compensation",
      "3. Ratification of Independent Registered Public Accounting Firm",
      "4. Transaction of other business properly brought before the meeting",
    ].forEach((p) => {
      doc.text(p, 48, y);
      y += 24;
    });
  } else {
    renderGeneric(doc, client, job);
  }

  return new Uint8Array(doc.output("arraybuffer"));
}

// --- Generate one set of mailings per client, themed with that client's brand ---
async function main() {
  let clientCount = 0;
  let fileCount = 0;
  let logoHits = 0;
  let headerLogoHits = 0;

  for (const [fullName, cfg] of Object.entries(brandConfigs)) {
    const ticker = cfg.ticker;
    if (!ticker) continue;

    const logo = await loadLogoForBrand(cfg);
    const headerLogo = await loadHeaderLogoForBrand(cfg);
    if (logo) logoHits++;
    else console.warn(`[mock-mailings] No light logo for ${ticker} (${fullName})`);
    if (headerLogo) headerLogoHits++;
    else console.warn(`[mock-mailings] No header logo for ${ticker} (${fullName})`);

    const client: ClientTheme = {
      companyName: cfg.companyName || fullName,
      ticker,
      logo,
      headerLogo,
      primaryColor: cfg.primaryColor,
      secondaryColor: cfg.secondaryColor,
      address: ["P.O. Box 8016", "Cary, NC 27512-9903"],
      voteSiteCode: ticker.toUpperCase(),
      phone: "1-866-523-3647",
    };

    const dir = path.join(outRoot, ticker.toUpperCase());
    fs.mkdirSync(dir, { recursive: true });

    for (const job of buildJobs(fullName)) {
      fs.writeFileSync(path.join(dir, job.file), Buffer.from(renderJob(client, job)));
      fileCount++;
    }
    clientCount++;
  }

  console.log(
    `Done. Generated ${fileCount} PDFs across ${clientCount} clients (${logoHits} light logos, ${headerLogoHits} header logos) in ${outRoot}.`,
  );
}

await main();
