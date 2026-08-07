/**
 * Splits each client's generated Full Set package into its constituent
 * mailing pieces, so the Mailing tab can thumbnail every piece individually.
 *
 * The generated packages (scripts/generate-full-set-pdfs.tsx) always render
 * the same 16-page structure, so the pieces fall on fixed page ranges:
 *
 *   pages  1–2   Notice of Annual Meeting
 *   pages  3–6   Proxy Statement
 *   pages  7–14  Annual Report
 *   pages 15–16  Proxy Card
 *
 * Output, per client: public/mock-mailings/{TICKER}/full-set/{piece}.pdf and
 * a manifest.json the Mailing tab reads to build its thumbnail grid. Packages
 * that are not the generated 16-page layout (WEN's is the client's real
 * merged filing) are left alone — the UI falls back to the meeting's database
 * documents, then the merged package.
 *
 * Run from issuer-portal/: pnpm dlx tsx scripts/split-full-set-pdfs.ts
 */
import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

/** The page count every generated package renders to. */
const GENERATED_PAGE_COUNT = 16;

interface PieceRange {
  /** File name inside the client's full-set/ folder. */
  readonly file: string;
  readonly label: string;
  /** 0-indexed, inclusive. */
  readonly firstPage: number;
  readonly lastPage: number;
}

const PIECES: readonly PieceRange[] = [
  {
    file: "notice.pdf",
    label: "Notice of Annual Meeting",
    firstPage: 0,
    lastPage: 1,
  },
  {
    file: "proxy-statement.pdf",
    label: "Proxy Statement",
    firstPage: 2,
    lastPage: 5,
  },
  {
    file: "annual-report.pdf",
    label: "Annual Report",
    firstPage: 6,
    lastPage: 13,
  },
  { file: "proxy-card.pdf", label: "Proxy Card", firstPage: 14, lastPage: 15 },
];

/**
 * Real client filings don't follow the generated layout, so their piece
 * boundaries are listed by hand. WEN's package is its real merged 2026
 * filing: cover and letter, notice, proxy statement, the annual review
 * section, then the Form 10-K — five pieces, exercising the grid's
 * widest layout.
 */
const REAL_PACKAGE_PIECES: Readonly<Record<string, readonly PieceRange[]>> = {
  WEN: [
    {
      file: "letter.pdf",
      label: "Letter to Stockholders",
      firstPage: 0,
      lastPage: 3,
    },
    {
      file: "notice.pdf",
      label: "Notice of Annual Meeting",
      firstPage: 4,
      lastPage: 5,
    },
    {
      file: "proxy-statement.pdf",
      label: "Proxy Statement",
      firstPage: 6,
      lastPage: 159,
    },
    {
      file: "annual-review.pdf",
      label: "2025 Annual Review",
      firstPage: 160,
      lastPage: 163,
    },
    {
      file: "annual-report.pdf",
      label: "Annual Report (Form 10-K)",
      firstPage: 164,
      lastPage: 287,
    },
  ],
};

interface ManifestPiece {
  readonly file: string;
  readonly label: string;
}

const outRoot = path.join(process.cwd(), "public", "mock-mailings");

async function splitClient(ticker: string): Promise<"split" | "skipped"> {
  const packagePath = path.join(outRoot, ticker, "full-set.pdf");
  if (!fs.existsSync(packagePath)) {
    return "skipped";
  }

  const packageDocument = await PDFDocument.load(fs.readFileSync(packagePath));
  const overridePieces = REAL_PACKAGE_PIECES[ticker];
  if (
    overridePieces === undefined &&
    packageDocument.getPageCount() !== GENERATED_PAGE_COUNT
  ) {
    return "skipped";
  }

  const pieceDir = path.join(outRoot, ticker, "full-set");
  fs.mkdirSync(pieceDir, { recursive: true });

  const manifest: ManifestPiece[] = [];
  for (const piece of overridePieces ?? PIECES) {
    const pieceDocument = await PDFDocument.create();
    const pageIndexes = Array.from(
      { length: piece.lastPage - piece.firstPage + 1 },
      (unused, offset) => piece.firstPage + offset
    );
    const pages = await pieceDocument.copyPages(packageDocument, pageIndexes);
    for (const page of pages) {
      pieceDocument.addPage(page);
    }
    fs.writeFileSync(
      path.join(pieceDir, piece.file),
      await pieceDocument.save({ useObjectStreams: true })
    );
    manifest.push({ file: piece.file, label: piece.label });
  }

  fs.writeFileSync(
    path.join(pieceDir, "manifest.json"),
    `${JSON.stringify({ pieces: manifest }, null, 2)}\n`
  );
  return "split";
}

async function main(): Promise<void> {
  let split = 0;
  let skipped = 0;

  for (const entry of fs.readdirSync(outRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    const result = await splitClient(entry.name);
    if (result === "split") {
      split++;
    } else {
      skipped++;
      console.log(`Skipped ${entry.name} — no generated 16-page package.`);
    }
  }

  console.log(`Done. Split ${split} packages (${skipped} skipped).`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
