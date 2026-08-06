/**
 * Reference code attached to the mailing-thumbnail requirements.
 *
 * @remarks
 * Stored as strings so the page can show and download them without the build
 * compiling them. Every sample here is code that ships, included so the spec
 * shows exactly how the preview is wired together — from the tile slot through
 * to the generators behind each preview.
 */

import type { CodeSample } from "@/app/specs/ui-enhancements/code-samples";

const FEATURE_TILE_SLOT = `// components/FeatureTile.tsx — the optional preview slot (abridged).
// The tile content and the thumbnail sit in a row; tiles without a thumbnail
// render exactly as before.

interface FeatureTileProps {
  // …existing props…
  /** Optional preview rendered to the right of the tile content. */
  readonly thumbnail?: React.ReactNode;
}

<Box sx={{ display: "flex", flexDirection: "row", alignItems: "stretch", flexGrow: 1, minWidth: 0 }}>
  <Box sx={{ flexGrow: 1, minWidth: 0, p: 2, pt: 3, display: "flex", flexDirection: "column" }}>
    {/* title, subtitle, description … */}
  </Box>
  {thumbnail != null && (
    <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0, pr: 2, pl: 1 }}>
      {thumbnail}
    </Box>
  )}
</Box>
`;

const MAILING_PREVIEW_TILES = `// components/Meeting/MailingPreviewTiles.tsx (abridged).
// Resolves the client from the route, themes the electronic email from the
// brand config, and opens the shared document viewer on click.

const ticker =
  typeof params.clientTicker === "string" ? params.clientTicker.toUpperCase() : "";
const brand = Object.values(brandConfigs).find(
  (config) => config.ticker?.toUpperCase() === ticker
);
const company = brand?.companyName ?? ticker;
const brandColor = brand?.primaryColor ?? theme.palette.primary.main;

const fullSetUrl = \`/mock-mailings/\${ticker}/full-set.pdf\`;
const naaUrl = \`/mock-mailings/\${ticker}/naa.pdf\`;
const electronicUrl = \`\${API_BASE}/emails/preview?\` +
  new URLSearchParams({
    template: "mailing-electronic-notice",
    format: "html",
    company,
    color: brandColor,
  }).toString();

// Full Set / NAA → PDF thumbnail; Electronic → scaled email iframe.
<FeatureTile
  variant="base"
  title={formatNumber(value)}
  subtitle={subtitle}
  thumbnail={
    <DocumentThumbnail filePath={fullSetUrl} onClick={() => openPdf("Full Set", fullSetUrl)} />
  }
/>

// One viewer for all three previews: PDFs open normally, the electronic email
// opens in the website (iframe) view.
<DocumentViewer
  open={activePreview !== null}
  onClose={closePreview}
  fileUrl={activePreview?.fileUrl}
  title={activePreview?.title}
  isWebsiteView={activePreview?.isWebsite ?? false}
  signatureAreas={[]}
  hideActivityButtons
  showDownloadButton={activePreview?.isWebsite === false}
/>
`;

const ELECTRONIC_EMAIL = `// mock-api-server/emails/MailingElectronicNotice.tsx (abridged).
// A basic, themeable electronic-delivery notice. The header, banner, and button
// adopt the client's brand colour; text colour is chosen for contrast.

const accent = brandColor && brandColor.length > 0 ? brandColor : COLORS.navy;
const onAccent = contrastText(accent);

<Section style={{ backgroundColor: accent, padding: "20px 32px" }}>
  <Row>
    <Column>
      <Text style={{ color: onAccent, fontSize: "15px", fontWeight: "700" }}>
        {companyName}
      </Text>
      <Text style={{ color: onAccent, opacity: 0.8, fontSize: "12px" }}>
        {meetingType} • Electronic Delivery
      </Text>
    </Column>
    <Column align="right"><BNLogo /></Column>
  </Row>
</Section>

<Button href={voteSiteUrl} style={{ backgroundColor: accent, color: onAccent }}>
  View Materials & Vote →
</Button>
`;

const PDF_GENERATOR_JOBS = `// scripts/generate-mock-mailing-pdfs.tsx — the Full Set and NAA jobs (abridged).
// Emitted per client into public/mock-mailings/{TICKER}/, themed with the
// client's brand colours and logo.

{
  // NAA → themed Notice of Internet Availability card + full agenda.
  file: "naa.pdf",
  jobName: "NAA — Notice of Internet Availability",
  meetingType: "Annual Meeting of Shareholders",
  layout: "proxy",
},
{
  // Full Set → the complete printed package, as a themed cover letter.
  file: "full-set.pdf",
  jobName: "Full Set — Complete Proxy Package",
  meetingType: "Annual Meeting of Shareholders",
  layout: "generic",
  body: [
    "FULL SET OF PROXY MATERIALS",
    "",
    \`Enclosed is the complete set of proxy materials for the \${fullName} \` +
      "Annual Meeting of Shareholders…",
  ],
}
`;

const PREVIEW_ROUTE = `// mock-api-server/app/api/emails/preview/route.ts (abridged).
// Renders the electronic notice, themed from query params, as JSON or HTML.

case "mailing-electronic-notice": {
  element = React.createElement(
    MailingElectronicNotice,
    buildElectronicProperties(searchParams)
  );
  break;
}

const html = await render(element);

// format=html → an HTML document the viewer can iframe.
if (searchParams.get("format") === "html") {
  return withCors(
    new NextResponse(html, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    })
  );
}
return withCors(NextResponse.json({ html }));
`;

export const CODE_SAMPLES: readonly CodeSample[] = [
  {
    asBuilt: true,
    code: FEATURE_TILE_SLOT,
    filename: "components/FeatureTile.tsx",
    language: "tsx",
    satisfies: ["MTP-01"],
    sectionId: "mailing-preview-thumbnails",
    title: "The tile's optional thumbnail slot",
  },
  {
    asBuilt: true,
    code: MAILING_PREVIEW_TILES,
    filename: "components/Meeting/MailingPreviewTiles.tsx",
    language: "tsx",
    satisfies: ["MTP-02", "MTP-03", "MTP-04", "MTP-05", "MTP-06"],
    sectionId: "mailing-preview-thumbnails",
    title: "Wiring the tiles, thumbnails, and viewer",
  },
  {
    asBuilt: true,
    code: ELECTRONIC_EMAIL,
    filename: "mock-api-server/emails/MailingElectronicNotice.tsx",
    language: "tsx",
    satisfies: ["MTP-03", "GEN-02"],
    sectionId: "generated-mailing-documents",
    title: "The themeable electronic notice",
  },
  {
    asBuilt: true,
    code: PDF_GENERATOR_JOBS,
    filename: "scripts/generate-mock-mailing-pdfs.tsx",
    language: "tsx",
    satisfies: ["GEN-01"],
    sectionId: "generated-mailing-documents",
    title: "The Full Set and NAA generator jobs",
  },
  {
    asBuilt: true,
    code: PREVIEW_ROUTE,
    filename: "mock-api-server/app/api/emails/preview/route.ts",
    language: "typescript",
    satisfies: ["GEN-03"],
    sectionId: "generated-mailing-documents",
    title: "Serving the notice as JSON or HTML",
  },
];
