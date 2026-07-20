/**
 * Generates mock follow-up proxy-mailing PDFs for the Additional Mailing Summary
 * prototype, styled after the Figma "Notice of Internet Availability of Proxy
 * Materials" design and themed with each client's brand colors.
 *
 * Rendered with @react-pdf/renderer for consistency with the portal's report
 * exporters (see utils/reportPdfTheme.tsx).
 *
 * Output: issuer-portal/public/mock-mailings/*.pdf
 * Run: npx tsx scripts/generate-mock-mailing-pdfs.tsx
 */
import ReactPDF, {
  Document,
  Font,
  Line,
  Image as PDFImage,
  Page,
  Rect,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import fs from "node:fs";
import path from "node:path";
import React from "react";

import { brandConfigs } from "../utils/brandConfig";
import {
  type RasterizedLogo,
  loadHeaderLogoForBrand,
  loadLogoForBrand,
} from "./mailing-pdf-logo";

// Register Roboto font
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-latin-300-normal.woff",
      fontWeight: 300,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-latin-400-normal.woff",
      fontWeight: 400,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-latin-500-normal.woff",
      fontWeight: 500,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-latin-700-normal.woff",
      fontWeight: 700,
    },
  ],
});

const INK = "#282C46";
const PAGE_WIDTH = 612; // LETTER, pt

/** Pick black or white text for legibility on a given background. */
function contrastText(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#111111" : "#FFFFFF";
}

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
  /** "proxy" → themed Notice of Internet Availability card; "generic" → themed-header doc */
  layout: "proxy" | "generic";
  /** Generic-layout body copy; empty strings render as paragraph breaks */
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
      // Non-proxy document → generic themed-header layout
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
        `The Board of Directors of ${fullName} is providing these supplemental materials to ` +
          "shareholders of record as of the record date. They contain additional information " +
          "regarding the proposals to be voted on at the meeting that was not available at the " +
          "time of the original mailing.",
        "",
        "Please review this supplement together with the proxy statement previously delivered to " +
          "you. No action is required if you do not wish to change your previously submitted vote.",
      ],
    },
    {
      // Non-proxy document → generic themed-header layout
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
        `Our records indicate your ${fullName} shares have not yet been voted for the upcoming ` +
          "meeting. Your vote is important regardless of the number of shares you own.",
        "",
        "Voting takes only a few minutes — vote online, by phone, or by returning the enclosed " +
          "proxy card. Have your control number ready.",
        "",
        "Thank you for being a valued shareholder.",
      ],
    },
  ];
}

const outRoot = path.join(process.cwd(), "public", "mock-mailings");
fs.mkdirSync(outRoot, { recursive: true });

/** Faux Intelligent Mail barcode (variable-height vertical bars). */
const FauxBarcode: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => {
  const bars = 65;
  const gap = width / bars;
  return (
    <Svg width={width} height={height}>
      {Array.from({ length: bars }, (_, i) => {
        const mode = (i * 7 + 3) % 4; // 0..3 → full / ascender / descender / tracker
        let y = 0;
        let barHeight = height;
        if (mode === 1) {
          barHeight = height * 0.6;
        } else if (mode === 2) {
          y = height * 0.4;
          barHeight = height * 0.6;
        } else if (mode === 3) {
          y = height * 0.35;
          barHeight = height * 0.3;
        }
        return (
          <Rect
            key={i}
            x={i * gap}
            y={y}
            width={gap * 0.5}
            height={barHeight}
            fill="#000000"
          />
        );
      })}
    </Svg>
  );
};

/** Deterministic faux-QR block (white bg, black modules + corner finders). */
const FauxQr: React.FC<{ size: number }> = ({ size }) => {
  const cells = 11;
  const c = size / cells;

  const modules: React.ReactElement[] = [];
  for (let r = 0; r < cells; r++) {
    for (let col = 0; col < cells; col++) {
      if ((r * 7 + col * 5 + r * col) % 3 === 0) {
        modules.push(
          <Rect
            key={`m-${r}-${col}`}
            x={col * c}
            y={r * c}
            width={c}
            height={c}
            fill="#000000"
          />
        );
      }
    }
  }

  const finder = (fx: number, fy: number, key: string) => (
    <React.Fragment key={key}>
      <Rect x={fx} y={fy} width={c * 3} height={c * 3} fill="#000000" />
      <Rect
        x={fx + c * 0.6}
        y={fy + c * 0.6}
        width={c * 1.8}
        height={c * 1.8}
        fill="#FFFFFF"
      />
      <Rect x={fx + c} y={fy + c} width={c} height={c} fill="#000000" />
    </React.Fragment>
  );

  return (
    <Svg width={size} height={size}>
      <Rect x={0} y={0} width={size} height={size} fill="#FFFFFF" />
      {modules}
      {finder(0, 0, "tl")}
      {finder(size - c * 3, 0, "tr")}
      {finder(0, size - c * 3, "bl")}
    </Svg>
  );
};

/** Outlined checkbox with an X mark, used in the "Your vote matters!" panel. */
const CheckboxMark: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <Svg width={size} height={size}>
    <Rect
      x={2}
      y={2}
      width={size - 4}
      height={size - 4}
      stroke={color}
      strokeWidth={3.5}
      fill="none"
    />
    <Line
      x1={10}
      y1={10}
      x2={size - 10}
      y2={size - 10}
      stroke={color}
      strokeWidth={3}
    />
    <Line
      x1={size - 10}
      y1={10}
      x2={10}
      y2={size - 10}
      stroke={color}
      strokeWidth={3}
    />
  </Svg>
);

interface ContactProps {
  label: string;
  value: string;
  primary: string;
  secondary: string;
}

const Contact: React.FC<ContactProps> = ({
  label,
  value,
  primary,
  secondary,
}) => (
  <View style={{ marginBottom: 8 }}>
    <Text style={{ fontSize: 10, fontWeight: 700, color: primary }}>
      {label}
    </Text>
    <Text
      style={{ fontSize: 9.5, fontWeight: 700, color: secondary, marginTop: 2 }}
    >
      {value}
    </Text>
  </View>
);

/** Page 1 of the proxy mailing: themed Notice of Internet Availability card. */
const ProxyNoticePage: React.FC<{ client: ClientTheme; job: MailingJob }> = ({
  client,
  job,
}) => {
  const primary = client.primaryColor;
  const secondary = client.secondaryColor;
  const bannerText = contrastText(primary);
  const logo = client.logo;

  return (
    <Page size="LETTER" style={{ fontFamily: "Roboto", padding: 0 }}>
      {/* Outer frame */}
      <View
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          right: 16,
          bottom: 16,
          borderWidth: 2,
          borderColor: INK,
        }}
      />

      <View style={{ paddingTop: 36, paddingHorizontal: 48, flexGrow: 1 }}>
        {/* Header: logo OR company name + address (left), QR placeholder (right) */}
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View>
            {logo ? (
              <PDFImage
                src={logo.dataUri}
                style={{ height: 34, width: 34 * logo.aspect }}
              />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: primary,
                    marginRight: 8,
                  }}
                />
                <Text style={{ fontSize: 16, fontWeight: 700, color: INK }}>
                  {client.companyName}
                </Text>
              </View>
            )}
            <View style={{ marginTop: 8 }}>
              {client.address.map((line) => (
                <Text
                  key={line}
                  style={{ fontSize: 8, color: "#5A5A5A", marginBottom: 2 }}
                >
                  {line}
                </Text>
              ))}
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 8, color: "#3C3C3C", marginBottom: 6 }}>
              Scan code for mobile voting
            </Text>
            <FauxQr size={50} />
          </View>
        </View>

        {/* Important notice line */}
        <Text
          style={{
            marginTop: 16,
            textAlign: "center",
            fontSize: 9.5,
            color: primary,
          }}
        >
          Important Notice Regarding the Availability of Proxy Materials for{" "}
          {client.companyName}
        </Text>

        {/* Banner (solid, full content width) */}
        <View
          style={{
            marginTop: 12,
            backgroundColor: primary,
            paddingVertical: 7,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: 700, color: bannerText }}>
            {job.meetingType}
          </Text>
        </View>

        {/* Meeting details */}
        <Text
          style={{
            marginTop: 16,
            textAlign: "center",
            fontSize: 11,
            color: primary,
          }}
        >
          {job.meetingDateLine}
        </Text>
        <Text
          style={{
            marginTop: 5,
            textAlign: "center",
            fontSize: 11,
            color: primary,
          }}
        >
          {job.meetingLocation}
        </Text>
        <Text
          style={{
            marginTop: 5,
            textAlign: "center",
            fontSize: 8.5,
            color: "#6E6E6E",
          }}
        >
          {job.recordDateLine}
        </Text>

        {/* Recipient address + Intelligent Mail barcode */}
        <View style={{ marginTop: 20 }}>
          {["Voter Name", "186 Fleet Street", "London, NY 12345"].map(
            (line) => (
              <Text
                key={line}
                style={{ fontSize: 9, color: INK, marginBottom: 3 }}
              >
                {line}
              </Text>
            )
          )}
          <View style={{ marginTop: 8 }}>
            <FauxBarcode width={150} height={16} />
          </View>
        </View>

        {/* "Your vote matters!" panel (left) + contacts column (right) */}
        <View style={{ flexDirection: "row", marginTop: 16 }}>
          <View
            style={{
              width: "56%",
              backgroundColor: primary,
              paddingHorizontal: 16,
              paddingVertical: 16,
              minHeight: 108,
              flexDirection: "row",
            }}
          >
            <View style={{ marginTop: 8 }}>
              <CheckboxMark size={44} color={secondary} />
            </View>
            <View style={{ marginLeft: 16 }}>
              <Text style={{ fontSize: 26, fontWeight: 700, color: "#FFFFFF" }}>
                Your vote
              </Text>
              <Text style={{ fontSize: 26, fontWeight: 700, color: "#FFFFFF" }}>
                matters!
              </Text>
              <Text style={{ fontSize: 8, color: "#FFFFFF", marginTop: 6 }}>
                To order paper materials, use one
              </Text>
              <Text style={{ fontSize: 8, color: "#FFFFFF" }}>
                of the following methods:
              </Text>
            </View>
          </View>

          <View style={{ flex: 1, marginLeft: 24 }}>
            <Contact
              label="Internet:"
              value={`investorelections.com/${client.voteSiteCode}`}
              primary={primary}
              secondary={secondary}
            />
            <Contact
              label="Call:"
              value={client.phone}
              primary={primary}
              secondary={secondary}
            />
            <Contact
              label="Email:"
              value="paper@investorelections.com"
              primary={primary}
              secondary={secondary}
            />

            {/* Control number box */}
            <Text style={{ fontSize: 6.5, color: "#828282", marginBottom: 2 }}>
              Your control number
            </Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: INK,
                paddingVertical: 6,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: 700, color: INK }}>
                8796439-8453
              </Text>
            </View>
            <Text style={{ fontSize: 6.5, color: "#828282", marginTop: 4 }}>
              Have the 12 digit control number located in the box above
            </Text>
          </View>
        </View>

        {/* Body copy */}
        <Text
          style={{
            marginTop: 24,
            fontSize: 10,
            fontWeight: 700,
            color: primary,
          }}
        >
          For a convenient way to view proxy materials and VOTE go to
          www.proxypush.com/
          {client.voteSiteCode}
        </Text>
        <View style={{ marginTop: 10 }}>
          {[
            "Vote in Person: Please review meeting materials for meeting attendance requirements and directions to the meeting.",
            "This communication presents only an overview of the more complete proxy materials that are available to you on the Internet.",
            "This is not a ballot. You cannot use this notice to vote your shares. We encourage you to access and review all of the important information contained in the proxy materials before voting.",
          ].map((line) => (
            <Text
              key={line}
              style={{ fontSize: 8.5, color: "#3C3C3C", marginBottom: 6 }}
            >
              {line}
            </Text>
          ))}
        </View>
        <Text
          style={{
            marginTop: 8,
            fontSize: 8.5,
            fontWeight: 700,
            color: primary,
            textDecoration: "underline",
          }}
        >
          SEE REVERSE FOR FULL AGENDA
        </Text>
      </View>

      {/* Perforation line near bottom */}
      <View style={{ position: "absolute", bottom: 44, left: 28 }}>
        <Svg width={PAGE_WIDTH - 56} height={2}>
          <Line
            x1={0}
            y1={1}
            x2={PAGE_WIDTH - 56}
            y2={1}
            stroke="#787878"
            strokeWidth={0.8}
            strokeDasharray="3 3"
          />
        </Svg>
      </View>
    </Page>
  );
};

/** Page 2 of the proxy mailing: full agenda / reverse side. */
const AgendaPage: React.FC<{ client: ClientTheme }> = ({ client }) => {
  const primary = client.primaryColor;
  return (
    <Page size="LETTER" style={{ fontFamily: "Roboto", padding: 0 }}>
      <View
        style={{
          height: 56,
          backgroundColor: primary,
          justifyContent: "center",
          paddingHorizontal: 48,
        }}
      >
        <Text
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: contrastText(primary),
          }}
        >
          Full Meeting Agenda
        </Text>
      </View>
      <View style={{ paddingHorizontal: 48, paddingTop: 40 }}>
        {[
          "1. Election of Directors",
          "2. Advisory Vote on Executive Compensation",
          "3. Ratification of Independent Registered Public Accounting Firm",
          "4. Transaction of other business properly brought before the meeting",
        ].map((item) => (
          <Text
            key={item}
            style={{ fontSize: 11, color: INK, marginBottom: 13 }}
          >
            {item}
          </Text>
        ))}
      </View>
    </Page>
  );
};

/** Generic themed-header document layout for non-proxy-card mailings. */
const GenericPage: React.FC<{ client: ClientTheme; job: MailingJob }> = ({
  client,
  job,
}) => {
  const primary = client.primaryColor;
  const secondary = client.secondaryColor;
  const headerText = contrastText(primary);
  const logo = client.headerLogo;

  return (
    <Page size="LETTER" style={{ fontFamily: "Roboto", padding: 0 }}>
      {/* Header bar themed with the client primary color */}
      <View
        style={{
          height: 84,
          backgroundColor: primary,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 56,
        }}
      >
        {logo ? (
          <>
            <PDFImage
              src={logo.dataUri}
              style={{ height: 40, width: 40 * logo.aspect }}
            />
            <Text style={{ fontSize: 10, color: headerText, marginLeft: 14 }}>
              {job.meetingType}
            </Text>
          </>
        ) : (
          <View>
            <Text style={{ fontSize: 16, fontWeight: 700, color: headerText }}>
              {client.companyName}
            </Text>
            <Text style={{ fontSize: 10, color: headerText, marginTop: 4 }}>
              {job.meetingType}
            </Text>
          </View>
        )}
      </View>

      <View style={{ paddingHorizontal: 56, paddingTop: 36 }}>
        {/* Job title + secondary accent rule */}
        <Text style={{ fontSize: 14, fontWeight: 700, color: INK }}>
          {job.jobName}
        </Text>
        <View
          style={{
            width: 120,
            height: 3,
            backgroundColor: secondary,
            marginTop: 6,
          }}
        />

        {/* Body copy; empty strings act as paragraph breaks */}
        <View style={{ marginTop: 26 }}>
          {(job.body ?? []).map((line, index) =>
            line ? (
              <Text
                key={index}
                style={{ fontSize: 10.5, color: "#373737", marginBottom: 6 }}
              >
                {line}
              </Text>
            ) : (
              <View key={index} style={{ height: 8 }} />
            )
          )}
        </View>

        {/* Meeting reference footer block */}
        <View
          style={{
            marginTop: 28,
            borderTopWidth: 1,
            borderTopColor: "#DCDCDC",
            paddingTop: 16,
          }}
        >
          <Text
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              color: primary,
              marginBottom: 4,
            }}
          >
            {job.meetingType}
          </Text>
          <Text style={{ fontSize: 9.5, color: "#5A5A5A", marginBottom: 3 }}>
            {job.meetingDateLine}
          </Text>
          <Text style={{ fontSize: 9.5, color: "#5A5A5A", marginBottom: 3 }}>
            {job.meetingLocation}
          </Text>
          <Text style={{ fontSize: 9.5, color: "#5A5A5A" }}>
            {job.recordDateLine}
          </Text>
        </View>
      </View>
    </Page>
  );
};

const MailingDocument: React.FC<{ client: ClientTheme; job: MailingJob }> = ({
  client,
  job,
}) => (
  <Document>
    {job.layout === "proxy" ? (
      <>
        <ProxyNoticePage client={client} job={job} />
        <AgendaPage client={client} />
      </>
    ) : (
      <GenericPage client={client} job={job} />
    )}
  </Document>
);

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
    else
      console.warn(`[mock-mailings] No light logo for ${ticker} (${fullName})`);
    if (headerLogo) headerLogoHits++;
    else
      console.warn(
        `[mock-mailings] No header logo for ${ticker} (${fullName})`
      );

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
      await ReactPDF.renderToFile(
        <MailingDocument client={client} job={job} />,
        path.join(dir, job.file)
      );
      fileCount++;
    }
    clientCount++;
  }

  console.log(
    `Done. Generated ${fileCount} PDFs across ${clientCount} clients (${logoHits} light logos, ${headerLogoHits} header logos) in ${outRoot}.`
  );
}

await main();
