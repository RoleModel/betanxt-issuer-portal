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
 * The pieces are derived from a package that is already in the repository, so
 * only a handful of them are committed and postinstall runs this to produce
 * the rest. That is what stops a deployment from showing different Full Set
 * thumbnails than a developer sees locally: without it, every client whose
 * pieces are not committed falls back to the merged package, and its tile
 * previews one document where it should preview the whole package.
 *
 * A client that already has a manifest is left alone, so the committed pieces
 * never churn. Pass --force to re-split every package after changing the page
 * ranges below.
 *
 * Run from issuer-portal/: node scripts/split-full-set-pdfs.ts [--force]
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
 * Real packages don't follow the generated layout, so their piece boundaries
 * are listed by hand. WEN's is the client's real merged 2026 filing: cover
 * and letter, notice, proxy statement, the annual review section, then the
 * Form 10-K — five pieces, exercising the grid's widest layout. FOC's is the
 * merge of the FocalPoint brand deliverables, and is the only package that
 * mails a corporate responsibility report.
 *
 * A piece's first page is the one the Mailing tab thumbnails, so the
 * boundaries below are set to open each piece on a page that identifies it.
 * The three-page table of contents (pages 7–9 of WEN's filing, with a blank
 * on 10) rides with the notice for that reason: left at the head of the proxy
 * statement it made two of the five pieces thumbnail as a wall of contents
 * entries, indistinguishable from each other.
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
      lastPage: 9,
    },
    {
      file: "proxy-statement.pdf",
      label: "Proxy Statement",
      firstPage: 10,
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
  FOC: [
    {
      file: "notice.pdf",
      label: "Notice of Annual Meeting",
      firstPage: 0,
      lastPage: 8,
    },
    {
      file: "proxy-statement.pdf",
      label: "Proxy Statement",
      firstPage: 9,
      lastPage: 29,
    },
    {
      file: "annual-report.pdf",
      label: "Fiscal 2025 Annual Report",
      firstPage: 30,
      lastPage: 132,
    },
    {
      file: "corporate-responsibility.pdf",
      label: "Corporate Responsibility Report",
      firstPage: 133,
      lastPage: 150,
    },
    {
      file: "proxy-card.pdf",
      label: "Proxy Card",
      firstPage: 151,
      lastPage: 153,
    },
  ],
};

interface ManifestPiece {
  readonly file: string;
  readonly label: string;
}

const outRoot = path.join(process.cwd(), "public", "mock-mailings");

/** Re-split packages that already have a manifest, rather than leaving them. */
const isForce = process.argv.includes("--force");

async function splitClient(
  ticker: string
): Promise<"split" | "current" | "skipped"> {
  const packagePath = path.join(outRoot, ticker, "full-set.pdf");
  if (!fs.existsSync(packagePath)) {
    return "skipped";
  }

  // pdf-lib stamps each save with fresh object ids, so re-splitting a package
  // rewrites bytes that are already correct. Committed pieces would show up
  // as modified after every install if this ran unconditionally.
  if (
    !isForce &&
    fs.existsSync(path.join(outRoot, ticker, "full-set", "manifest.json"))
  ) {
    return "current";
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
  let current = 0;
  let skipped = 0;

  for (const entry of fs.readdirSync(outRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    const result = await splitClient(entry.name);
    if (result === "split") {
      split++;
    } else if (result === "current") {
      current++;
    } else {
      skipped++;
      console.log(`Skipped ${entry.name} — no generated 16-page package.`);
    }
  }

  console.log(
    `Done. Split ${split} packages (${current} already split, ${skipped} skipped).`
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
