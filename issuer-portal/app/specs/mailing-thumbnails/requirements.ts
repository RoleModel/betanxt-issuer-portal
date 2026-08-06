/**
 * What to build for the Mailing preview thumbnails.
 *
 * @remarks
 * Written as finished behaviour, mirroring the UI-enhancements spec: a developer
 * should be able to build from this without knowing which parts already exist.
 * Where a file is named, it is named so they can find the thing.
 *
 * Content lives in a typed module because it is the deliverable — the page
 * renders it and the download serialises it, so the two cannot drift. The shared
 * shapes (Requirement, SpecSection, …) are reused from the UI-enhancements spec
 * so both packages render through the same page component.
 */

import type {
  SpecMeta,
  SpecSection,
} from "@/app/specs/ui-enhancements/requirements";

/* -------------------------------------------------------------------------- */
/* 1. Mailing Preview Thumbnails                                              */
/* -------------------------------------------------------------------------- */

const previewThumbnails: SpecSection = {
  id: "mailing-preview-thumbnails",
  title: "1. Mailing Preview Thumbnails",
  summary:
    "Requirements for clickable thumbnail previews beside each Primary Mailing Summary figure (Full Set, NAA, Electronic) so a client can see exactly what went out.",
  background: [
    "The Mailing tab's Primary Mailing Summary shows three figures — Full Set, NAA, and Electronic. Each figure now carries a small thumbnail of the document that figure counts, in the space to the right of the tile.",
    "Full Set and NAA are printed pieces, previewed from a generated PDF. Electronic is an email, previewed from a themed react-email notice rendered with the current client's brand colour.",
    "Clicking any thumbnail opens the existing document viewer full-screen: the PDF viewer for Full Set and NAA, the website (iframe) view for the Electronic email.",
  ],
  topics: [
    {
      question: "Which figures get a thumbnail, and what each thumbnail shows.",
      answer: [
        "All three Primary Mailing Summary figures. Full Set and NAA show the first page of the generated PDF; Electronic shows a scaled preview of the rendered email.",
      ],
      requirementIds: ["MTP-01", "MTP-02", "MTP-03"],
    },
    {
      question: "What happens when a thumbnail is clicked.",
      answer: [
        "The document viewer opens over the page. Full Set and NAA open in the PDF viewer with a download button; Electronic opens the email in the website (iframe) view.",
        "Previews are read-only — no signature fields, and the comment and history panels are hidden.",
      ],
      requirementIds: ["MTP-04", "MTP-06"],
    },
    {
      question: "How previews reflect the client being viewed.",
      answer: [
        "The generated PDFs are themed per client by the generator. The Electronic email is themed at request time from the current client's brand colour and name, so it matches whichever client's meeting is open.",
      ],
      requirementIds: ["MTP-05"],
    },
  ],
  requirements: [
    {
      id: "MTP-01",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/mailing",
          label: "Mailing — Primary Mailing Summary",
        },
      ],
      title: "A thumbnail slot on the tile",
      statement:
        "FeatureTile accepts an optional `thumbnail` node rendered to the right of the tile content. Tiles without one are unchanged.",
      rationale:
        "The tile is reused across the app; the preview is additive so no existing tile shifts.",
      evidence: ["components/FeatureTile.tsx"],
      acceptance: [
        "Given a FeatureTile with no thumbnail, when it renders, then it looks exactly as before.",
        "Given a FeatureTile with a thumbnail, when it renders, then the thumbnail sits to the right of the title and subtitle.",
      ],
    },
    {
      id: "MTP-02",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/mailing",
          label: "Mailing — Full Set / NAA",
        },
      ],
      title: "Full Set and NAA show the generated PDF",
      statement:
        "The Full Set and NAA tiles show a PDF thumbnail of `/mock-mailings/{TICKER}/full-set.pdf` and `/mock-mailings/{TICKER}/naa.pdf` respectively.",
      evidence: [
        "components/Meeting/MailingPreviewTiles.tsx",
        "components/Documents/DocumentThumbnail.tsx",
      ],
      acceptance: [
        "Given a client with generated mailings, when the Mailing tab loads, then the Full Set and NAA tiles render the first page of their PDF.",
        "Given a client with no generated PDF, when the tile renders, then it falls back to a document icon rather than erroring.",
      ],
    },
    {
      id: "MTP-03",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/mailing",
          label: "Mailing — Electronic",
        },
      ],
      title: "Electronic shows the email notice",
      statement:
        "The Electronic tile shows a scaled preview of the rendered `mailing-electronic-notice` email.",
      rationale:
        "Electronic delivery is an email, not a printed piece, so its preview is the email itself rather than a PDF.",
      evidence: [
        "components/Meeting/MailingPreviewTiles.tsx",
        "mock-api-server/emails/MailingElectronicNotice.tsx",
      ],
      acceptance: [
        "Given the Mailing tab, when the Electronic tile renders, then it shows a miniature of the email.",
      ],
    },
    {
      id: "MTP-04",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/mailing",
          label: "Mailing — click a thumbnail",
        },
      ],
      title: "Clicking opens the document viewer",
      statement:
        "Clicking a Full Set or NAA thumbnail opens the PDF viewer; clicking the Electronic thumbnail opens the email in the website (iframe) view.",
      evidence: ["components/Documents/DocumentViewer.tsx"],
      acceptance: [
        "Given the Full Set thumbnail, when a user clicks it, then the PDF opens full-screen with the tile's label as the title.",
        "Given the Electronic thumbnail, when a user clicks it, then the email opens full-screen in the iframe view.",
      ],
    },
    {
      id: "MTP-05",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/mailing",
          label: "Mailing — any client",
        },
      ],
      title: "Previews match the client",
      statement:
        "The Electronic email is themed from the current client's brand colour and company name, resolved from the route ticker and the brand config.",
      evidence: [
        "components/Meeting/MailingPreviewTiles.tsx",
        "utils/brandConfig.ts",
      ],
      acceptance: [
        "Given a client with a brand colour, when the Electronic preview renders, then its header and accents use that colour.",
        "Given a client with no brand config, when the preview renders, then it falls back to the theme's primary colour.",
      ],
    },
    {
      id: "MTP-06",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/mailing",
          label: "Mailing — a preview",
        },
      ],
      title: "Previews are read-only",
      statement:
        "Previews open with no signature areas and with the comment and history panels hidden. Full Set and NAA offer a download; Electronic does not.",
      rationale:
        "A mailing preview is a record of what went out, not a document to sign or discuss.",
      evidence: ["components/Meeting/MailingPreviewTiles.tsx"],
      acceptance: [
        "Given any preview, when it opens, then no signature or form fields appear.",
        "Given a PDF preview, when it opens, then a download button is available.",
      ],
    },
  ],
  tables: [
    {
      title: "What each figure previews",
      headers: ["Figure", "Preview", "Source"],
      rows: [
        [
          "Full Set",
          "First page of the PDF",
          "/mock-mailings/{TICKER}/full-set.pdf",
        ],
        ["NAA", "First page of the PDF", "/mock-mailings/{TICKER}/naa.pdf"],
        [
          "Electronic",
          "Scaled email",
          "GET /api/emails/preview?template=mailing-electronic-notice&format=html",
        ],
      ],
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* 2. Generated Mailing Documents                                            */
/* -------------------------------------------------------------------------- */

const generatedDocuments: SpecSection = {
  id: "generated-mailing-documents",
  title: "2. Generated Mailing Documents",
  summary:
    "The document generators behind the previews: the per-client PDF generator and the themeable Electronic email template.",
  background: [
    "Full Set and NAA PDFs come from a single generator that renders each client's mailings with `@react-pdf/renderer`, themed with that client's brand colours and logo. Output lands in `public/mock-mailings/{TICKER}/`.",
    "The Electronic notice is a react-email template rendered on the mock API. The preview route can return it as JSON (for the email preview screen) or as an HTML document (for iframing in the viewer), and accepts query parameters that theme it per client.",
  ],
  requirements: [
    {
      id: "GEN-01",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/mailing",
          label: "Mailing — Full Set / NAA previews",
        },
      ],
      title: "The PDF generator emits Full Set and NAA",
      statement:
        "The mock-mailing generator emits `full-set.pdf` (a full-package cover letter) and `naa.pdf` (a Notice of Internet Availability) for every client with a ticker, themed with that client's brand.",
      evidence: ["scripts/generate-mock-mailing-pdfs.tsx"],
      acceptance: [
        "Given `pnpm run generate:mock-mailings`, when it finishes, then each client folder contains full-set.pdf and naa.pdf.",
        "Given a client's brand colour, when its PDFs render, then the banner and headings use that colour.",
      ],
    },
    {
      id: "GEN-02",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/mailing",
          label: "Mailing — Electronic preview",
        },
      ],
      title: "The Electronic email is themeable",
      statement:
        "The `MailingElectronicNotice` template renders a basic electronic-delivery notice whose header, banner, and primary button adopt a brand colour passed to it, falling back to the BetaNXT navy.",
      rationale:
        "The exact copy is still being finalised; the template is a basic, themeable starting point.",
      evidence: ["mock-api-server/emails/MailingElectronicNotice.tsx"],
      acceptance: [
        "Given a brand colour, when the notice renders, then its header and button use that colour with legible text.",
        "Given no brand colour, when the notice renders, then it uses the default navy.",
      ],
    },
    {
      id: "GEN-03",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/mailing",
          label: "Mailing — Electronic preview",
        },
      ],
      title: "The preview route serves HTML",
      statement:
        "The email preview route renders `mailing-electronic-notice`, returns it as an HTML document when `format=html`, and reads client fields (company, colour, dates) from query parameters.",
      evidence: ["mock-api-server/app/api/emails/preview/route.ts"],
      acceptance: [
        "Given `?template=mailing-electronic-notice&format=html`, when the route responds, then the body is text/html.",
        "Given `ENABLE_EMAIL_PREVIEW` is not set, when the route is called, then it returns 404 without rendering.",
      ],
    },
  ],
  tables: [
    {
      title: "Components used",
      headers: ["Component", "Role"],
      rows: [
        ["components/FeatureTile.tsx", "Hosts the optional thumbnail slot"],
        [
          "components/Meeting/MailingPreviewTiles.tsx",
          "Wires the three tiles, thumbnails, and viewer",
        ],
        [
          "components/Documents/DocumentThumbnail.tsx",
          "Renders the first page of a PDF as a thumbnail",
        ],
        [
          "components/Documents/DocumentViewer.tsx",
          "Full-screen PDF and website (iframe) preview",
        ],
        [
          "scripts/generate-mock-mailing-pdfs.tsx",
          "Generates full-set.pdf and naa.pdf per client",
        ],
        [
          "mock-api-server/emails/MailingElectronicNotice.tsx",
          "Themeable Electronic delivery email",
        ],
        [
          "mock-api-server/app/api/emails/preview/route.ts",
          "Renders the email as JSON or HTML",
        ],
      ],
    },
  ],
};

export const SPEC_SECTIONS: readonly SpecSection[] = [
  previewThumbnails,
  generatedDocuments,
];

export const SPEC_META: SpecMeta = {
  audience: "Engineering",
  author: "Issuer Portal UX",
  repository: "betanxt-issuer-portal / issuer-portal",
  status: "For build",
  title: "Issuer Portal — Mailing Preview Thumbnails",
  version: "1.0",
};
