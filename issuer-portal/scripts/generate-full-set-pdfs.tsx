/**
 * Generates a full, multi-page "Full Set" proxy package per client, themed with
 * each client's brand colours and logo. Modelled on the FocalPoint brand
 * deliverables (focalpoint-brand-deliverables/) — a baseline template whose
 * copy is filled from per-client variables (name, ticker, brand, and
 * deterministic financials) so every client gets a complete themed package:
 *
 *   Notice of Annual Meeting → Proxy Statement → Annual Report highlights →
 *   Proxy Voting Card
 *
 * Output: issuer-portal/public/mock-mailings/{TICKER}/full-set.pdf
 * Run from issuer-portal/: pnpm dlx tsx scripts/generate-full-set-pdfs.tsx
 *
 * WEN is skipped — its full-set.pdf is the client's real merged Proxy
 * Statement + Annual Report and must not be overwritten.
 */
import ReactPDF, {
  Document,
  Font,
  Image as PDFImage,
  Page,
  Polygon,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import React from "react";

import { brandConfigs } from "../utils/brandConfig";
import {
  type RasterizedLogo,
  loadHeaderLogoForBrand,
  loadLogoForBrand,
} from "./mailing-pdf-logo";

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

const INK = "#1F2933";
const MUTED = "#6B7280";
const SKIP_TICKERS = new Set(["WEN"]); // has real client-provided full-set

/** Black or white text for legibility on a background colour. */
function contrastText(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#111111" : "#FFFFFF";
}

interface Director {
  name: string;
  title: string;
  bio: string;
}

interface Proposal {
  title: string;
  description: string;
  recommendation: "FOR" | "AGAINST";
}

// Shared illustrative content, filled with each client's name at render time.
const DIRECTORS: Director[] = [
  {
    name: "Dana Whitfield",
    title: "Non-Executive Chair of the Board",
    bio: "Former CEO of a national specialty retail chain; brings three decades of multi-unit operations and brand strategy experience.",
  },
  {
    name: "Alexandra Reyes",
    title: "President & Chief Executive Officer",
    bio: "Named CEO in 2022; previously led digital and integrated strategy for a national media and marketing services holding company.",
  },
  {
    name: "Marcus Ilori",
    title: "Lead Independent Director",
    bio: "Retired audit partner with deep expertise in financial reporting, internal controls, and enterprise risk oversight.",
  },
  {
    name: "Renée Castellano",
    title: "Director — Marketing & Consumer Insights",
    bio: "Chief marketing officer of a consumer packaged goods company; specializes in brand loyalty and customer data strategy.",
  },
  {
    name: "Priya Anand",
    title: "Director — Technology & Digital",
    bio: "Former CTO of a national digital platform; advises the board on data security and AI initiatives.",
  },
  {
    name: "Thomas Okafor",
    title: "Director — Client Operations & Delivery",
    bio: "Twenty years leading client operations and account delivery for large, multi-office professional services organizations.",
  },
  {
    name: "Helena Voss",
    title: "Director — Human Capital & Culture",
    bio: "Human resources executive focused on workforce development, retention, and total rewards strategy.",
  },
  {
    name: "James Calloway",
    title: "Director — Corporate Development",
    bio: "Executive with a background in M&A, partnerships, and growth strategy for communications and marketing services companies.",
  },
];

const PROPOSALS: Proposal[] = [
  {
    title: "Election of Directors",
    description:
      "Vote on the election of eight director nominees, each to serve a one-year term expiring at the 2027 Annual Meeting.",
    recommendation: "FOR",
  },
  {
    title: "Ratification of Independent Registered Public Accounting Firm",
    description:
      "Ratify the Audit Committee's appointment of Harrow & Vance LLP as the independent registered public accounting firm for fiscal year 2026.",
    recommendation: "FOR",
  },
  {
    title: "Advisory Vote to Approve Named Executive Officer Compensation",
    description:
      "A non-binding advisory vote on the compensation of the named executive officers.",
    recommendation: "FOR",
  },
  {
    title: "Stockholder Proposal — Political Advertising & Lobbying Disclosure",
    description:
      "Requests a report on political advertising, lobbying, and trade association expenditures used for political purposes.",
    recommendation: "AGAINST",
  },
  {
    title: "Stockholder Proposal — Responsible Use of AI in Content Production",
    description:
      "Requests a report on policies governing AI-assisted content and creative production.",
    recommendation: "AGAINST",
  },
  {
    title: "Stockholder Proposal — Diversity in Leadership & Creative Teams",
    description:
      "Requests a report on workforce diversity across leadership, account, and creative teams.",
    recommendation: "AGAINST",
  },
];

interface Financials {
  revenue: number;
  growthPct: number;
  netIncome: number;
  eps: number;
  employees: number;
  offices: number;
}

/** Deterministic per-client financial highlights so each package differs. */
function financialsFor(ticker: string): Financials {
  let seed = 0;
  for (const ch of ticker) {
    seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  }
  const next = (min: number, max: number): number => {
    seed = (seed * 1_103_515_245 + 12_345) >>> 0;
    return min + ((seed % 10_000) / 10_000) * (max - min);
  };
  const revenue = Math.round(next(400, 4200));
  return {
    revenue,
    growthPct: Number(next(2, 18).toFixed(1)),
    netIncome: Math.round(revenue * next(0.06, 0.16)),
    eps: Number(next(1.2, 7.8).toFixed(2)),
    employees: Math.round(next(1200, 9000) / 100) * 100,
    offices: Math.round(next(6, 40)),
  };
}

const usd = (millions: number): string =>
  `$${millions.toLocaleString("en-US")}M`;

interface ClientData {
  companyName: string;
  legalName: string;
  ticker: string;
  exchange: string;
  primary: string;
  secondary: string;
  logo: RasterizedLogo | null;
  headerLogo: RasterizedLogo | null;
  financials: Financials;
  controlNumber: string;
  proxyPushUrl: string;
  voteSiteUrl: string;
  phone: string;
  coverPhoto: string | null;
  /** Director nominees for this company's meeting (from the database). */
  directors: Director[];
  /**
   * Ballot proposals for this company's meeting (from the database). Index 0 is
   * always the "Election of Directors" umbrella proposal; the rest follow.
   */
  proposals: BallotProposal[];
}

interface BallotProposal {
  number: number;
  title: string;
  description: string;
  recommendation: string;
}

/** Human descriptions keyed by the database `proposal_type`. */
const PROPOSAL_DESCRIPTIONS: Record<string, string> = {
  "Auditor Ratification":
    "Ratify the Audit Committee's appointment of the Company's independent registered public accounting firm for the fiscal year.",
  "Say on Pay":
    "A non-binding advisory vote on the compensation of the Company's named executive officers.",
  "Say on Pay Frequency":
    "A non-binding advisory vote on how frequently the Company will hold future advisory votes on executive compensation.",
  "Stockholder Proposal":
    "A stockholder proposal, if properly presented at the Annual Meeting.",
};

/** A deterministic 12-digit control number, grouped as 4-4-4. */
function controlNumberFor(ticker: string): string {
  let seed = 7;
  for (const ch of ticker) {
    seed = (seed * 131 + ch.charCodeAt(0)) >>> 0;
  }
  const digits = String(seed).padStart(12, "0").slice(0, 12);
  return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
}

/** Reads a value from the environment, falling back to the issuer-portal .env
 * file so the script picks up keys when run directly with tsx. */
function readEnv(name: string): string | null {
  const fromEnv = process.env[name];
  if (fromEnv !== undefined && fromEnv.length > 0) {
    return fromEnv;
  }
  try {
    const contents = fs.readFileSync(path.join(process.cwd(), ".env"), "utf8");
    const match = new RegExp(`^${name}\\s*=\\s*(.+)$`, "m").exec(contents);
    const value = match?.[1]?.trim().replace(/^['"]|['"]$/gu, "");
    return value !== undefined && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

const SUPABASE_URL =
  readEnv("NEXT_PUBLIC_SUPABASE_URL") ?? "http://127.0.0.1:54321";
// Well-known local Supabase anon key (a public dev key, not a secret).
const SUPABASE_ANON_KEY =
  readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

interface DbProposalRow {
  proposal_number: number | null;
  proposal_title: string;
  proposal_type: string | null;
  director_name: string | null;
  recommendation: string | null;
}

/** The shared illustrative content, used when the database has no proposals. */
const FALLBACK_PROPOSALS: BallotProposal[] = PROPOSALS.map(
  (proposal, index) => ({
    number: index + 1,
    title: proposal.title,
    description: proposal.description,
    recommendation: proposal.recommendation,
  })
);

/** Fetches the real director nominees and proposals for a company's annual
 * meeting from the database (Supabase REST). Returns null when unavailable so
 * the caller can fall back to the shared illustrative content. */
async function fetchMeetingProposals(
  meetingId: string
): Promise<{ directors: Director[]; proposals: BallotProposal[] } | null> {
  try {
    const url =
      `${SUPABASE_URL}/rest/v1/proposal?meeting_id=eq.${meetingId}` +
      "&order=proposal_number" +
      "&select=proposal_number,proposal_title,proposal_type,director_name,recommendation";
    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!response.ok) {
      return null;
    }

    const rows = (await response.json()) as DbProposalRow[];
    if (!Array.isArray(rows) || rows.length === 0) {
      return null;
    }

    const hasDirector = (row: DbProposalRow): boolean =>
      row.director_name !== null && row.director_name.length > 0;

    const directors: Director[] = rows.filter(hasDirector).map((row) => ({
      name: row.director_name ?? "",
      title: "Director Nominee",
      bio: "Nominated for election to a one-year term expiring at the 2027 Annual Meeting of Stockholders.",
    }));

    const describe = (row: DbProposalRow): string =>
      row.proposal_type !== null && row.proposal_type in PROPOSAL_DESCRIPTIONS
        ? PROPOSAL_DESCRIPTIONS[row.proposal_type]
        : row.proposal_title;

    const proposals: BallotProposal[] = [];
    let number = 1;
    if (directors.length > 0) {
      proposals.push({
        number,
        title: "Election of Directors",
        description: `Vote on the election of ${directors.length} director nominee${
          directors.length === 1 ? "" : "s"
        }, each to serve a one-year term expiring at the 2027 Annual Meeting.`,
        recommendation: "FOR",
      });
      number += 1;
    }
    for (const row of rows.filter((candidate) => !hasDirector(candidate))) {
      proposals.push({
        number,
        title: row.proposal_title,
        description: describe(row),
        recommendation: (row.recommendation ?? "FOR").toUpperCase(),
      });
      number += 1;
    }

    return { directors, proposals };
  } catch {
    return null;
  }
}

const COVER_CACHE_DIR = path.join(os.tmpdir(), "mock-mailings-cover-cache");

interface FalResult {
  images?: { url?: string }[];
}

/** Generates a client-relevant landscape cover image with fal.ai (Nano Banana /
 * Gemini Flash Image) and returns it as a data URI, caching the bytes on disk so
 * re-runs are free. Returns null (→ solid-colour cover) when there is no key or
 * the request fails. */
async function fetchCoverImage(
  ticker: string,
  prompt: string,
  key: string | null
): Promise<string | null> {
  const cacheFile = path.join(COVER_CACHE_DIR, `${ticker}.png`);
  const toDataUri = (buffer: Buffer): string =>
    `data:image/png;base64,${buffer.toString("base64")}`;

  if (fs.existsSync(cacheFile)) {
    return toDataUri(fs.readFileSync(cacheFile));
  }
  if (key === null) {
    return null;
  }

  try {
    const response = await fetch("https://fal.run/fal-ai/nano-banana", {
      method: "POST",
      headers: {
        Authorization: `Key ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        num_images: 1,
        aspect_ratio: "16:9",
      }),
    });
    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as FalResult;
    const imageUrl = json.images?.[0]?.url;
    if (imageUrl === undefined) {
      return null;
    }

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return null;
    }
    const buffer = Buffer.from(await imageResponse.arrayBuffer());

    fs.mkdirSync(COVER_CACHE_DIR, { recursive: true });
    fs.writeFileSync(cacheFile, buffer);
    return toDataUri(buffer);
  } catch {
    return null;
  }
}

const MEETING = {
  dateLine: "Thursday, May 14, 2026 — 10:00 AM Eastern Time",
  dateShort: "May 14, 2026",
  format: "Virtual-only — registration required",
  recordDate: "March 16, 2026",
  votingDeadline: "May 12, 2026, 11:59 PM ET",
  fiscalYearEnd: "December 28, 2025",
};

/** Footer on every content page. */
const Footer: React.FC<{
  readonly data: ClientData;
}> = ({ data }) => (
  <View
    fixed
    style={{
      position: "absolute",
      bottom: 28,
      left: 48,
      right: 48,
      flexDirection: "row",
      justifyContent: "space-between",
      borderTopWidth: 0.75,
      borderTopColor: "#E5E7EB",
      paddingTop: 6,
    }}
  >
    <Text style={{ fontSize: 7.5, color: MUTED }}>
      {data.legalName} | 2026 Annual Meeting
    </Text>
    <Text
      fixed
      style={{ fontSize: 7.5, color: MUTED }}
      render={({ pageNumber, totalPages }) =>
        `Page ${pageNumber} of ${totalPages}`
      }
    />
  </View>
);

/** Letter-spaced section label, e.g. "N O T I C E   O F   M E E T I N G". */
const spaced = (text: string): string => text.split("").join(" ");

/** A themed section cover page. */
const CoverPage: React.FC<{
  readonly data: ClientData;
  readonly label: string;
  readonly title: string;
  readonly subtitle: string;
  readonly meta: { label: string; value: string }[];
}> = ({ data, label, title, subtitle, meta }) => {
  const onPrimary = contrastText(data.primary);
  const { headerLogo } = data;

  return (
    <Page size="LETTER" style={{ fontFamily: "Roboto", padding: 0 }}>
      <View
        style={{
          position: "relative",
          paddingTop: 96,
          paddingHorizontal: 56,
          paddingBottom: 56,
          minHeight: 360,
        }}
      >
        {data.coverPhoto ? (
          <PDFImage
            src={data.coverPhoto}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : null}
        {/* Brand-colour wash over the photo keeps the cover on-brand and the
            text legible; a solid fill when no photo is available. */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: data.primary,
            opacity: data.coverPhoto ? 0.76 : 1,
          }}
        />
        {headerLogo ? (
          <PDFImage
            src={headerLogo.dataUri}
            style={{
              height: 30,
              width: 30 * headerLogo.aspect,
              marginBottom: 40,
            }}
          />
        ) : (
          <Text
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: onPrimary,
              marginBottom: 40,
            }}
          >
            {data.companyName}
          </Text>
        )}
        <Text
          style={{
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: 1,
            color: onPrimary,
            opacity: 0.85,
            marginBottom: 18,
          }}
        >
          {spaced(label)}
        </Text>
        <Text style={{ fontSize: 30, fontWeight: 700, color: onPrimary }}>
          {title}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: onPrimary,
            opacity: 0.9,
            marginTop: 10,
            maxWidth: 420,
          }}
        >
          {subtitle}
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          paddingHorizontal: 56,
          paddingTop: 32,
        }}
      >
        {meta.map((row) => (
          <View key={row.label} style={{ width: "50%", marginBottom: 22 }}>
            <Text
              style={{
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: 0.6,
                color: data.secondary,
                marginBottom: 4,
              }}
            >
              {row.label.toUpperCase()}
            </Text>
            <Text style={{ fontSize: 11, color: INK }}>{row.value}</Text>
          </View>
        ))}
      </View>

      <View style={{ position: "absolute", bottom: 40, left: 56 }}>
        <Text style={{ fontSize: 8, color: MUTED }}>
          Prepared for BetaNXT, Inc. · Sample package for demonstration
          purposes.
        </Text>
      </View>
    </Page>
  );
};

/** A content page with a themed header band and a title. */
const ContentPage: React.FC<{
  readonly data: ClientData;
  readonly section: string;
  readonly title: string;
  readonly page?: string;
  readonly children: React.ReactNode;
}> = ({ data, section, title, children }) => (
  <Page
    size="LETTER"
    style={{
      fontFamily: "Roboto",
      paddingTop: 48,
      paddingHorizontal: 48,
      paddingBottom: 56,
    }}
  >
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottomWidth: 2,
        borderBottomColor: data.primary,
        paddingBottom: 8,
        marginBottom: 20,
      }}
    >
      <Text
        style={{
          fontSize: 8,
          fontWeight: 700,
          letterSpacing: 0.8,
          color: data.secondary,
        }}
      >
        {section.toUpperCase()}
      </Text>
      <Text style={{ fontSize: 8, color: MUTED }}>{data.exchange}</Text>
    </View>
    <Text
      style={{ fontSize: 17, fontWeight: 700, color: INK, marginBottom: 14 }}
    >
      {title}
    </Text>
    {children}
    <Footer data={data} />
  </Page>
);

const Para: React.FC<{ readonly children: React.ReactNode }> = ({
  children,
}) => (
  <Text
    style={{
      fontSize: 10,
      color: "#37414A",
      lineHeight: 1.5,
      marginBottom: 10,
    }}
  >
    {children}
  </Text>
);

const RecChip: React.FC<{ readonly rec: string }> = ({ rec }) => (
  <Text
    style={{
      fontSize: 8,
      fontWeight: 700,
      color: rec === "AGAINST" ? "#9A3412" : "#166534",
    }}
  >
    Board recommendation: {rec}
  </Text>
);

const ProposalItem: React.FC<{
  readonly num: number;
  readonly proposal: BallotProposal;
  readonly primary: string;
}> = ({ num, proposal, primary }) => (
  <View style={{ flexDirection: "row", marginBottom: 12 }}>
    <View
      style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: primary,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
      }}
    >
      <Text style={{ fontSize: 10, fontWeight: 700, color: "#FFFFFF" }}>
        {num}
      </Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 11, fontWeight: 700, color: INK }}>
        {proposal.title}
      </Text>
      <Text
        style={{
          fontSize: 9,
          color: "#4B5563",
          lineHeight: 1.4,
          marginTop: 2,
          marginBottom: 3,
        }}
      >
        {proposal.description}
      </Text>
      <RecChip rec={proposal.recommendation} />
    </View>
  </View>
);

const StatBox: React.FC<{
  readonly value: string;
  readonly label: string;
  readonly primary: string;
}> = ({ value, label, primary }) => (
  <View
    style={{
      width: "33.33%",
      paddingRight: 10,
      marginBottom: 16,
    }}
  >
    <Text style={{ fontSize: 20, fontWeight: 700, color: primary }}>
      {value}
    </Text>
    <Text style={{ fontSize: 8, color: MUTED, marginTop: 2 }}>
      {label.toUpperCase()}
    </Text>
  </View>
);

/** A simple financial table: a themed header row plus zebra-striped rows. The
 * first column is left-aligned labels; the rest are right-aligned figures. */
const FinancialTable: React.FC<{
  readonly header: string[];
  readonly rows: string[][];
  readonly primary: string;
}> = ({ header, rows, primary }) => (
  <View style={{ borderWidth: 0.75, borderColor: "#E5E7EB", marginBottom: 12 }}>
    <View style={{ flexDirection: "row", backgroundColor: primary }}>
      {header.map((cell, index) => (
        <Text
          key={cell}
          style={{
            flex: index === 0 ? 2.4 : 1,
            fontSize: 8,
            fontWeight: 700,
            color: "#FFFFFF",
            padding: 6,
            textAlign: index === 0 ? "left" : "right",
          }}
        >
          {cell}
        </Text>
      ))}
    </View>
    {rows.map((row, rowIndex) => (
      <View
        key={row[0]}
        style={{
          flexDirection: "row",
          borderTopWidth: 0.5,
          borderTopColor: "#E5E7EB",
          backgroundColor: rowIndex % 2 === 0 ? "#FFFFFF" : "#F7F8FA",
        }}
      >
        {row.map((cell, index) => (
          <Text
            key={`${row[0]}-${index}`}
            style={{
              flex: index === 0 ? 2.4 : 1,
              fontSize: 8.5,
              color: INK,
              fontWeight: index === 0 ? 500 : 400,
              padding: 6,
              textAlign: index === 0 ? "left" : "right",
            }}
          >
            {cell}
          </Text>
        ))}
      </View>
    ))}
  </View>
);

/** Three vote boxes (For / Against / Abstain) aligned under the ballot header. */
// Ballot table geometry (points). YOUR VOTE holds three equal mark columns; the
// BOARD RECOMMENDS column is separated by a continuous vertical rule.
const VOTE_W = 156;
const VOTE_COL_W = VOTE_W / 3;
const REC_W = 74;
const RULE = "#000000";
const GRAY = "#D9D9D9";

/** An empty black-bordered mark box. */
const MarkBox: React.FC = () => (
  <View style={{ width: 13, height: 13, borderWidth: 1, borderColor: RULE }} />
);

/** The three vote mark boxes under FOR / AGAINST / ABSTAIN. */
const VoteCells: React.FC = () => (
  <View style={{ width: VOTE_W, flexDirection: "row" }}>
    {[0, 1, 2].map((slot) => (
      <View key={slot} style={{ width: VOTE_COL_W, alignItems: "center" }}>
        <MarkBox />
      </View>
    ))}
  </View>
);

/** FOR / AGAINST / ABSTAIN column labels, repeated above each proposal block. */
const VoteColumnLabels: React.FC = () => (
  <View
    style={{ flexDirection: "row", paddingHorizontal: 8, paddingBottom: 2 }}
  >
    <View style={{ flex: 1 }} />
    <View style={{ width: VOTE_W, flexDirection: "row" }}>
      {["FOR", "AGAINST", "ABSTAIN"].map((option) => (
        <Text
          key={option}
          style={{
            width: VOTE_COL_W,
            textAlign: "center",
            fontSize: 6.5,
            fontWeight: 700,
            color: INK,
          }}
        >
          {option}
        </Text>
      ))}
    </View>
    <View style={{ width: REC_W, borderLeftWidth: 1, borderLeftColor: RULE }} />
  </View>
);

/** Gray table header: PROPOSAL · YOUR VOTE · BOARD OF DIRECTORS RECOMMENDS. */
const BallotTableHeader: React.FC = () => (
  <View
    style={{
      flexDirection: "row",
      backgroundColor: GRAY,
      paddingVertical: 10,
      paddingHorizontal: 8,
      alignItems: "flex-end",
    }}
  >
    <Text style={{ flex: 1, fontSize: 8, fontWeight: 700, color: INK }}>
      PROPOSAL
    </Text>
    <Text
      style={{
        width: VOTE_W,
        fontSize: 8,
        fontWeight: 700,
        color: INK,
        textAlign: "center",
      }}
    >
      YOUR VOTE
    </Text>
    <Text
      style={{
        width: REC_W,
        fontSize: 6.5,
        fontWeight: 700,
        color: INK,
        textAlign: "center",
        lineHeight: 1.2,
      }}
    >
      BOARD OF DIRECTORS RECOMMENDS
    </Text>
  </View>
);

/** Down-arrow drawn under the BOARD RECOMMENDS heading. */
const RecommendsArrow: React.FC = () => (
  <View style={{ flexDirection: "row", paddingHorizontal: 8 }}>
    <View style={{ flex: 1 }} />
    <View style={{ width: VOTE_W }} />
    <View
      style={{
        width: REC_W,
        borderLeftWidth: 1,
        borderLeftColor: RULE,
        alignItems: "center",
        paddingVertical: 2,
      }}
    >
      <Svg width={13} height={18} viewBox="0 0 13 18">
        <Polygon points="4,0 9,0 9,9 13,9 6.5,18 0,9 4,9" fill={RULE} />
      </Svg>
    </View>
  </View>
);

/** One ballot line: a proposal, a director sub-item, or a proposal heading. */
const BallotRow: React.FC<{
  readonly label: string;
  readonly rec?: string;
  readonly heading?: boolean;
  readonly indent?: boolean;
}> = ({ label, rec, heading = false, indent = false }) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 6,
      paddingHorizontal: 8,
    }}
  >
    <Text
      style={{
        flex: 1,
        fontSize: 8.5,
        color: INK,
        fontWeight: heading ? 700 : 400,
        paddingLeft: indent ? 16 : 0,
        paddingRight: 8,
      }}
    >
      {label}
    </Text>
    {heading ? <View style={{ width: VOTE_W }} /> : <VoteCells />}
    <View
      style={{
        width: REC_W,
        alignSelf: "stretch",
        borderLeftWidth: 1,
        borderLeftColor: RULE,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 8.5, fontWeight: 700, color: INK }}>
        {rec ?? ""}
      </Text>
    </View>
  </View>
);

const FullSetDocument: React.FC<{ readonly data: ClientData }> = ({ data }) => {
  const fin = data.financials;
  const { directors, proposals } = data;

  // Board-recommendation statement, built from the real proposals so it always
  // matches the ballot (e.g. "FOR Proposals 2, 3, and 4 and AGAINST Proposal 5").
  const others = proposals.filter(
    (proposal) => proposal.title !== "Election of Directors"
  );
  const forNumbers = others
    .filter((proposal) => proposal.recommendation === "FOR")
    .map((proposal) => proposal.number);
  const againstNumbers = others
    .filter((proposal) => proposal.recommendation === "AGAINST")
    .map((proposal) => proposal.number);
  const joinNumbers = (numbers: number[]): string =>
    numbers.length <= 1
      ? `Proposal ${numbers.join("")}`
      : `Proposals ${numbers.slice(0, -1).join(", ")} and ${
          numbers[numbers.length - 1]
        }`;
  const recommendStatement =
    "The Board of Directors recommends that you vote FOR each of the director nominees (Proposal 1)" +
    (forNumbers.length > 0 ? `, FOR ${joinNumbers(forNumbers)}` : "") +
    (againstNumbers.length > 0
      ? ` and AGAINST ${joinNumbers(againstNumbers)}`
      : "") +
    ".";

  // A deterministic five-year financial series (fiscal 2025 = the headline
  // figures, prior years scaled back by the growth rate) for the AR tables.
  const reportYears = [2021, 2022, 2023, 2024, 2025];
  const series = reportYears.map((year, index) => {
    const factor =
      (1 + fin.growthPct / 100) ** (index - (reportYears.length - 1));
    return {
      year,
      revenue: Math.round(fin.revenue * factor),
      netIncome: Math.round(fin.netIncome * factor),
      eps: Number((fin.eps * factor).toFixed(2)),
    };
  });

  return (
    <Document>
      {/* 1. Notice cover */}
      <CoverPage
        data={data}
        label="Notice of Annual Meeting"
        title="2026 Annual Meeting of Stockholders"
        subtitle={`${data.legalName} (${data.exchange}) — Notice of Meeting, Agenda, Director Nominees, and Voting Guide`}
        meta={[
          { label: "Meeting Date & Time", value: MEETING.dateLine },
          { label: "Format", value: MEETING.format },
          { label: "Record Date", value: MEETING.recordDate },
          { label: "Voting Deadline", value: MEETING.votingDeadline },
        ]}
      />

      {/* 2. Notice — agenda */}
      <ContentPage
        data={data}
        section="Notice of Annual Meeting"
        title="Meeting Agenda & Items to Be Voted On"
        page="Page 2 of 10"
      >
        <Para>
          A full description of each proposal, including the Board&apos;s
          complete rationale, appears in the {data.companyName} 2026 Proxy
          Statement. This page provides a condensed summary for quick reference.
        </Para>
        {proposals.map((proposal) => (
          <ProposalItem
            key={proposal.title}
            num={proposal.number}
            proposal={proposal}
            primary={data.primary}
          />
        ))}
      </ContentPage>

      {/* 3. Proxy Statement cover */}
      <CoverPage
        data={data}
        label="Proxy Statement"
        title="2026 Proxy Statement"
        subtitle={`${data.legalName} (${data.exchange}) — Notice of Annual Meeting, Board Nominees, and Items to Be Voted On`}
        meta={[
          { label: "Filed by", value: data.legalName },
          { label: "Meeting Date", value: MEETING.dateShort },
          { label: "Record Date", value: MEETING.recordDate },
          { label: "Prepared for", value: "BetaNXT, Inc." },
        ]}
      />

      {/* 4. Letter to stockholders */}
      <ContentPage
        data={data}
        section="Proxy Statement Summary"
        title="Letter to Stockholders"
        page="Page 4 of 10"
      >
        <Para>Dear Fellow Stockholders,</Para>
        <Para>
          On behalf of the Board of Directors, I am pleased to invite you to{" "}
          {data.companyName}&apos;s 2026 Annual Meeting of Stockholders. This
          past year, our teams sharpened their focus on the fundamentals that
          built this company: earning our clients&apos; trust, delivering work
          of the highest integrity, and disciplined growth.
        </Para>
        <Para>
          This Proxy Statement describes the items to be voted on at the Annual
          Meeting and provides information about our director nominees,
          corporate governance practices, and executive compensation program.
          Your vote matters, and we encourage you to review these materials and
          cast your vote before the deadline.
        </Para>
        <Para>
          Thank you for your continued confidence in {data.companyName}.
        </Para>
        <Text
          style={{ fontSize: 11, fontWeight: 700, color: INK, marginTop: 6 }}
        >
          Alexandra Reyes
        </Text>
        <Text style={{ fontSize: 9, color: MUTED }}>
          President &amp; Chief Executive Officer
        </Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            marginTop: 24,
            borderTopWidth: 0.75,
            borderTopColor: "#E5E7EB",
            paddingTop: 16,
          }}
        >
          <StatBox
            value={MEETING.dateShort}
            label="Meeting date"
            primary={data.primary}
          />
          <StatBox
            value={String(proposals.length)}
            label="Proposals"
            primary={data.primary}
          />
          <StatBox
            value={String(directors.length)}
            label="Director nominees"
            primary={data.primary}
          />
        </View>
      </ContentPage>

      {/* 5. Board nominees */}
      <ContentPage
        data={data}
        section="Proxy Statement Summary"
        title="Board of Director Nominees"
        page="Page 5 of 10"
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {directors.map((director) => (
            <View
              key={director.name}
              style={{ width: "50%", paddingRight: 14, marginBottom: 14 }}
            >
              <Text style={{ fontSize: 10.5, fontWeight: 700, color: INK }}>
                {director.name}
              </Text>
              <Text
                style={{
                  fontSize: 7.5,
                  fontWeight: 700,
                  letterSpacing: 0.4,
                  color: data.secondary,
                  marginTop: 1,
                  marginBottom: 3,
                }}
              >
                {director.title.toUpperCase()}
              </Text>
              <Text
                style={{ fontSize: 8.5, color: "#4B5563", lineHeight: 1.4 }}
              >
                {director.bio}
              </Text>
            </View>
          ))}
        </View>
      </ContentPage>

      {/* 6. Items to be voted on + voting/quorum */}
      <ContentPage
        data={data}
        section="Proxy Statement Summary"
        title="Items to Be Voted On"
        page="Page 6 of 10"
      >
        {proposals.map((proposal) => (
          <ProposalItem
            key={proposal.title}
            num={proposal.number}
            proposal={proposal}
            primary={data.primary}
          />
        ))}
        <Text
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: INK,
            marginTop: 8,
            marginBottom: 6,
          }}
        >
          Voting &amp; Quorum
        </Text>
        <Para>
          Holders of record of {data.companyName} common stock as of the record
          date, {MEETING.recordDate}, are entitled to notice of, and to vote at,
          the Annual Meeting. A majority of the shares outstanding and entitled
          to vote constitutes a quorum. Abstentions are counted as present for
          quorum purposes but are not counted as votes cast. Broker non-votes
          are not counted as votes cast on non-routine matters such as the
          election of directors.
        </Para>
      </ContentPage>

      {/* 7. Annual Report cover */}
      <CoverPage
        data={data}
        label="Annual Report"
        title="Fiscal 2025 Annual Report"
        subtitle={`${data.legalName} (${data.exchange}) — A Comprehensive Review for Shareholders`}
        meta={[
          { label: "Fiscal Year", value: `Ended ${MEETING.fiscalYearEnd}` },
          { label: "Ticker", value: data.exchange },
          { label: "Revenue", value: usd(fin.revenue) },
          { label: "Prepared for", value: "BetaNXT, Inc." },
        ]}
      />

      {/* 8. Fiscal at a glance */}
      <ContentPage
        data={data}
        section="Annual Report"
        title="Fiscal 2025 at a Glance"
        page="Page 8 of 10"
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <StatBox
            value={usd(fin.revenue)}
            label="Total revenue"
            primary={data.primary}
          />
          <StatBox
            value={`+${fin.growthPct}%`}
            label="Revenue growth"
            primary={data.primary}
          />
          <StatBox
            value={usd(fin.netIncome)}
            label="Net income"
            primary={data.primary}
          />
          <StatBox
            value={`$${fin.eps.toFixed(2)}`}
            label="Diluted EPS"
            primary={data.primary}
          />
          <StatBox
            value={fin.employees.toLocaleString("en-US")}
            label="Employees"
            primary={data.primary}
          />
          <StatBox
            value={String(fin.offices)}
            label="U.S. offices"
            primary={data.primary}
          />
        </View>
        <Para>
          {data.companyName} delivered disciplined growth in fiscal 2025, with
          total revenue of {usd(fin.revenue)}, up {fin.growthPct}% year over
          year, and net income of {usd(fin.netIncome)}. The complete
          Management&apos;s Discussion &amp; Analysis, consolidated financial
          statements, and notes appear in the full Annual Report.
        </Para>
        <Para>
          Figures on this page are illustrative and generated for demonstration
          purposes; they do not represent an actual {data.companyName} filing.
        </Para>
      </ContentPage>

      {/* Annual Report — Letter to Shareholders */}
      <ContentPage
        data={data}
        section="Annual Report"
        title="Letter to Shareholders"
      >
        <Para>Dear Fellow Shareholders,</Para>
        <Para>
          Fiscal 2025 was a year of disciplined execution for {data.companyName}
          . We grew total revenue {fin.growthPct}% to {usd(fin.revenue)} while
          investing in our people, our platforms, and the long-term
          relationships that define our business. Net income reached{" "}
          {usd(fin.netIncome)}, and diluted earnings per share were $
          {fin.eps.toFixed(2)}.
        </Para>
        <Para>
          We enter fiscal 2026 with momentum and a clear set of priorities:
          deepening client relationships, expanding our highest-value offerings,
          and maintaining the operational discipline that has served our
          shareholders well. On behalf of the Board and our{" "}
          {fin.employees.toLocaleString("en-US")} colleagues across{" "}
          {fin.offices} offices, thank you for your continued confidence.
        </Para>
        <Text
          style={{ fontSize: 11, fontWeight: 700, color: INK, marginTop: 6 }}
        >
          Alexandra Reyes
        </Text>
        <Text style={{ fontSize: 9, color: MUTED }}>
          President &amp; Chief Executive Officer
        </Text>
      </ContentPage>

      {/* Annual Report — Business Overview */}
      <ContentPage
        data={data}
        section="Annual Report"
        title="Business Overview"
      >
        <Para>
          {data.companyName} operates a diversified business serving clients
          across the markets in which it competes. Our strategy pairs organic
          growth with disciplined capital allocation, and our results reflect
          sustained demand for our products and services.
        </Para>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
          <StatBox
            value={usd(fin.revenue)}
            label="Total revenue"
            primary={data.primary}
          />
          <StatBox
            value={`+${fin.growthPct}%`}
            label="Revenue growth"
            primary={data.primary}
          />
          <StatBox
            value={`${Math.round((fin.netIncome / fin.revenue) * 100)}%`}
            label="Net margin"
            primary={data.primary}
          />
        </View>
        <Para>
          The sections that follow summarize management&apos;s discussion of our
          results, five-year selected financial data, and our condensed
          consolidated statements of operations.
        </Para>
      </ContentPage>

      {/* Annual Report — MD&A */}
      <ContentPage
        data={data}
        section="Annual Report"
        title="Management's Discussion & Analysis"
      >
        <Para>
          Total revenue increased {fin.growthPct}% year over year to{" "}
          {usd(fin.revenue)}, driven by growth across our core markets. Net
          income was {usd(fin.netIncome)}, representing a net margin of{" "}
          {Math.round((fin.netIncome / fin.revenue) * 100)}%, and diluted EPS
          was ${fin.eps.toFixed(2)}.
        </Para>
        <Para>
          We continued to invest in talent and technology while maintaining
          operating discipline. Liquidity remained strong, and we returned
          capital to shareholders consistent with our long-term framework. We
          expect continued momentum in fiscal 2026, subject to the risks and
          uncertainties described under Risk Factors.
        </Para>
      </ContentPage>

      {/* Annual Report — Five-Year Selected Financial Data */}
      <ContentPage
        data={data}
        section="Annual Report"
        title="Five-Year Selected Financial Data"
      >
        <FinancialTable
          primary={data.primary}
          header={[
            "($ in millions, except EPS)",
            ...reportYears.map((year) => String(year)),
          ]}
          rows={[
            ["Total revenue", ...series.map((row) => usd(row.revenue))],
            ["Net income", ...series.map((row) => usd(row.netIncome))],
            ["Diluted EPS", ...series.map((row) => `$${row.eps.toFixed(2)}`)],
          ]}
        />
        <Para>
          The table above presents selected financial data for the five fiscal
          years ended {MEETING.fiscalYearEnd}.
        </Para>
      </ContentPage>

      {/* Annual Report — Consolidated Statements of Operations */}
      <ContentPage
        data={data}
        section="Annual Report"
        title="Consolidated Statements of Operations"
      >
        <FinancialTable
          primary={data.primary}
          header={["($ in millions)", "Fiscal 2025", "Fiscal 2024"]}
          rows={[
            ["Total revenue", usd(fin.revenue), usd(series[3].revenue)],
            [
              "Cost of services",
              usd(Math.round(fin.revenue * 0.62)),
              usd(Math.round(series[3].revenue * 0.62)),
            ],
            [
              "Gross profit",
              usd(fin.revenue - Math.round(fin.revenue * 0.62)),
              usd(series[3].revenue - Math.round(series[3].revenue * 0.62)),
            ],
            [
              "Operating expenses",
              usd(Math.round(fin.revenue * 0.2)),
              usd(Math.round(series[3].revenue * 0.2)),
            ],
            ["Net income", usd(fin.netIncome), usd(series[3].netIncome)],
            [
              "Diluted EPS",
              `$${fin.eps.toFixed(2)}`,
              `$${series[3].eps.toFixed(2)}`,
            ],
          ]}
        />
        <Para>
          These condensed statements are presented for illustration and are
          derived from the figures shown elsewhere in this report.
        </Para>
      </ContentPage>

      {/* Annual Report — Corporate Responsibility */}
      <ContentPage
        data={data}
        section="Annual Report"
        title="Corporate Responsibility"
      >
        <Para>
          {data.companyName} is committed to operating responsibly across our
          workforce, our communities, and our environmental footprint. We report
          annually on our people, governance, and sustainability commitments.
        </Para>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
          <StatBox
            value={fin.employees.toLocaleString("en-US")}
            label="Employees"
            primary={data.primary}
          />
          <StatBox
            value={String(fin.offices)}
            label="U.S. offices"
            primary={data.primary}
          />
          <StatBox
            value={`${directors.length}`}
            label="Board nominees"
            primary={data.primary}
          />
        </View>
        <Para>
          Details of our corporate responsibility programs, metrics, and
          governance practices appear in our annual Corporate Responsibility
          Report.
        </Para>
      </ContentPage>

      {/* 9. Proxy Voting Card — front (solicitation + how to vote) */}
      <ContentPage
        data={data}
        section="Voting Materials"
        title="Proxy Card"
        page="Page 9 of 10"
      >
        <View
          style={{
            borderWidth: 1,
            borderColor: "#E5E7EB",
            padding: 12,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: 700, color: INK }}>
            {data.legalName}
          </Text>
          <Text style={{ fontSize: 9, color: INK, marginTop: 2 }}>
            Annual Meeting of Stockholders
          </Text>
          <Text style={{ fontSize: 8.5, color: MUTED, marginTop: 4 }}>
            For Stockholders of Record as of {MEETING.recordDate}
          </Text>
          <Text style={{ fontSize: 8.5, color: MUTED }}>
            {MEETING.dateLine}
          </Text>
          <Text style={{ fontSize: 8.5, color: MUTED, marginTop: 2 }}>
            Held via the Internet — please visit {data.voteSiteUrl}
          </Text>
        </View>

        <Para>
          The undersigned hereby appoints the Named Proxies, and each of them,
          with full power of substitution, as lawful agents and proxies to vote
          all shares of {data.legalName} common stock that the undersigned is
          entitled to vote at the 2026 Annual Meeting of Stockholders, and any
          adjournment or postponement thereof, upon the matters set forth on the
          reverse side.
        </Para>
        <Para>
          This proxy, if signed, dated and returned, will be voted as directed.
          If signed and returned without direction, the shares will be voted in
          accordance with the Board of Directors&apos; recommendations shown on
          the reverse side. The undersigned acknowledges receipt of the Notice
          of Annual Meeting, Proxy Statement, and Annual Report.
        </Para>

        <View style={{ flexDirection: "row", marginTop: 6 }}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            <Text
              style={{ fontSize: 12, fontWeight: 700, color: data.primary }}
            >
              Your vote matters!
            </Text>
            <Text style={{ fontSize: 8, color: MUTED, marginTop: 4 }}>
              Have your ballot ready and use one of the methods below:
            </Text>
            <Text style={{ fontSize: 8.5, color: "#4B5563", marginTop: 6 }}>
              Internet: {data.proxyPushUrl}
            </Text>
            <Text style={{ fontSize: 8.5, color: "#4B5563" }}>
              Phone: {data.phone}
            </Text>
            <Text style={{ fontSize: 8.5, color: "#4B5563" }}>
              Mail: return this card in the postage-paid envelope provided
            </Text>
            <Text
              style={{ fontSize: 8, fontWeight: 700, color: INK, marginTop: 8 }}
            >
              YOUR VOTE IS IMPORTANT! Please vote by {MEETING.votingDeadline}.
            </Text>
          </View>
          <View style={{ width: 176 }}>
            <Text style={{ fontSize: 7, color: MUTED, marginBottom: 3 }}>
              Your control number
            </Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: INK,
                paddingVertical: 9,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 1,
                  color: INK,
                }}
              >
                {data.controlNumber}
              </Text>
            </View>
            <Text style={{ fontSize: 6.5, color: MUTED, marginTop: 4 }}>
              Have the 12-digit control number in the box above available when
              you vote online or by phone.
            </Text>
          </View>
        </View>
      </ContentPage>

      {/* 10. Proxy Voting Card — ballot (reverse side, plain form) */}
      <Page
        size="LETTER"
        style={{
          fontFamily: "Roboto",
          paddingTop: 40,
          paddingHorizontal: 40,
          paddingBottom: 48,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <Text style={{ fontSize: 9, fontWeight: 700, color: INK }}>
            Please make your marks like this:
          </Text>
          <View
            style={{
              width: 14,
              height: 14,
              borderWidth: 1,
              borderColor: RULE,
              alignItems: "center",
              justifyContent: "center",
              marginHorizontal: 6,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: 700, color: RULE }}>
              X
            </Text>
          </View>
          <Text style={{ fontSize: 8, color: INK }}>
            Use dark black pencil or pen only
          </Text>
        </View>

        <Text
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: INK,
            marginBottom: 22,
            lineHeight: 1.4,
          }}
        >
          {recommendStatement.toUpperCase()}
        </Text>

        {/* Ballot table */}
        <BallotTableHeader />
        <RecommendsArrow />
        <BallotRow label="1.  Election of Directors" heading />
        <VoteColumnLabels />
        {directors.map((director, index) => (
          <BallotRow
            key={director.name}
            label={`1.${String(index + 1).padStart(2, "0")}  ${director.name}`}
            rec="FOR"
            indent
          />
        ))}
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: RULE,
            marginTop: 4,
            marginBottom: 4,
          }}
        />
        <VoteColumnLabels />
        {others.map((proposal) => (
          <BallotRow
            key={proposal.title}
            label={`${proposal.number}.  ${proposal.title}`}
            rec={proposal.recommendation}
          />
        ))}
        <View style={{ borderTopWidth: 1, borderTopColor: RULE }} />

        {/* Footnotes */}
        <Text
          style={{
            fontSize: 7.5,
            fontWeight: 700,
            color: INK,
            marginTop: 22,
            lineHeight: 1.4,
          }}
        >
          *If any other matters properly come before the meeting, shares
          represented by properly submitted proxies will be voted on such
          matters in the discretion of the Named Proxies.
        </Text>
        <Text
          style={{
            fontSize: 7.5,
            fontWeight: 700,
            color: INK,
            marginTop: 8,
            lineHeight: 1.4,
          }}
        >
          Only stockholders of record as of the close of business on{" "}
          {MEETING.recordDate}, the record date for the meeting, are entitled to
          receive notice of, and to vote at, the meeting.
        </Text>

        <View style={{ marginTop: 24, paddingLeft: 90 }}>
          <Text style={{ fontSize: 8.5, color: INK, lineHeight: 1.5 }}>
            Authorized Signatures - Must be completed for your instructions to
            be executed.
          </Text>
          <Text style={{ fontSize: 8.5, color: INK, lineHeight: 1.5 }}>
            Please sign exactly as your name(s) appears on your account. If held
            in joint tenancy, all persons should sign. Trustees, administrators,
            etc., should include title and authority. Corporations should
            provide full name of corporation and title of authorized officer
            signing the proxy card and/or voting instruction form.
          </Text>
        </View>

        {/* Bottom signature lines */}
        <View
          style={{
            position: "absolute",
            left: 40,
            right: 40,
            bottom: 40,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          {[
            "Signature (and Title if applicable)",
            "Signature (if held jointly)",
          ].map((caption) => (
            <View key={caption} style={{ width: "46%" }}>
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: RULE,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingTop: 4,
                }}
              >
                <Text style={{ fontSize: 8, color: INK }}>{caption}</Text>
                <Text style={{ fontSize: 8, color: INK }}>Date</Text>
              </View>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

const outRoot = path.join(process.cwd(), "public", "mock-mailings");

// Cover-photo search terms. Company names alone usually return no Unsplash
// results, so each cover pairs the company name with a stable corporate/industry
// term (varied per client) that the search reliably resolves.
const BRAND_CACHE_DIR = path.join(os.tmpdir(), "mock-mailings-brand-cache");

interface BrandfetchResult {
  description?: string;
  company?: { industries?: { name?: string }[] };
}

/** Fetches a company's description and industries from Brandfetch so cover
 * prompts depict the company's real business, not a generic building. Cached on
 * disk; returns null when there is no key or the request fails. */
async function fetchCompanyInfo(
  ticker: string,
  domain: string,
  key: string | null
): Promise<string | null> {
  const cacheFile = path.join(BRAND_CACHE_DIR, `${ticker}.txt`);
  if (fs.existsSync(cacheFile)) {
    const cached = fs.readFileSync(cacheFile, "utf8").trim();
    return cached.length > 0 ? cached : null;
  }
  if (key === null || domain.length === 0) {
    return null;
  }
  try {
    const response = await fetch(
      `https://api.brandfetch.io/v2/brands/${domain}`,
      { headers: { Authorization: `Bearer ${key}` } }
    );
    if (!response.ok) {
      return null;
    }
    const json = (await response.json()) as BrandfetchResult;
    const industries = (json.company?.industries ?? [])
      .map((industry) => industry.name)
      .filter((name): name is string => name !== undefined && name.length > 0);
    const uniqueIndustries = [...new Set(industries)].slice(0, 3);
    const parts: string[] = [];
    if (json.description !== undefined && json.description.length > 0) {
      parts.push(json.description);
    }
    if (uniqueIndustries.length > 0) {
      parts.push(`Industries: ${uniqueIndustries.join(", ")}`);
    }
    const info = parts.join(" ").trim();
    fs.mkdirSync(BRAND_CACHE_DIR, { recursive: true });
    fs.writeFileSync(cacheFile, info);
    return info.length > 0 ? info : null;
  } catch {
    return null;
  }
}

/** A cover-image prompt tailored to the client's actual business. */
function coverPromptFor(companyName: string, info: string | null): string {
  const subject =
    info !== null && info.length > 0 ? `${companyName} — ${info}` : companyName;
  return (
    `Editorial annual-report cover photograph for ${subject}. ` +
    "Depict imagery that evokes this specific company's actual industry, " +
    "products, and operations. Professional, premium, photographic; cinematic " +
    "lighting; muted brand-appropriate tones. Avoid generic office buildings, " +
    "skylines, and boardrooms. No text, no words, no logos, no watermarks."
  );
}

async function main() {
  let generated = 0;
  let skipped = 0;
  let withPhoto = 0;
  let withDbProposals = 0;

  const falKey = readEnv("FAL_API_KEY");
  const brandfetchKey = readEnv("BRANDFETCH_API_KEY");
  console.log(
    falKey === null
      ? "No FAL_API_KEY found — covers use the brand colour only."
      : `FAL_API_KEY found — generating Nano Banana covers${
          brandfetchKey === null ? "" : " (Brandfetch-informed prompts)"
        }.`
  );

  for (const [fullName, cfg] of Object.entries(brandConfigs)) {
    const { ticker } = cfg;
    if (!ticker) continue;

    const upper = ticker.toUpperCase();
    if (SKIP_TICKERS.has(upper)) {
      skipped++;
      continue;
    }

    const lower = ticker.toLowerCase();
    const companyName = cfg.companyName || fullName;
    const logo = await loadLogoForBrand(cfg);
    const headerLogo = await loadHeaderLogoForBrand(cfg);

    // Real director nominees and proposals from this company's annual meeting,
    // falling back to the shared illustrative content when the DB is offline.
    const fromDb =
      (await fetchMeetingProposals(`${lower}-annual-meeting-2026`)) ??
      (await fetchMeetingProposals(`${lower}-annual-meeting-2025`));
    if (fromDb !== null) withDbProposals++;

    const companyInfo = await fetchCompanyInfo(
      upper,
      cfg.domain,
      brandfetchKey
    );
    const coverPhoto = await fetchCoverImage(
      upper,
      coverPromptFor(companyName, companyInfo),
      falKey
    );
    if (coverPhoto !== null) withPhoto++;

    const data: ClientData = {
      companyName,
      legalName: `${companyName}, Inc.`,
      ticker: upper,
      exchange: `Nasdaq: ${upper}`,
      primary: cfg.primaryColor,
      secondary: cfg.secondaryColor,
      logo,
      headerLogo,
      financials: financialsFor(upper),
      controlNumber: controlNumberFor(upper),
      proxyPushUrl: `www.proxypush.com/${upper}`,
      voteSiteUrl: `www.proxydocs.com/${upper}`,
      phone: "1-866-829-5209",
      coverPhoto,
      directors: fromDb?.directors ?? DIRECTORS,
      proposals: fromDb?.proposals ?? FALLBACK_PROPOSALS,
    };

    const dir = path.join(outRoot, upper);
    fs.mkdirSync(dir, { recursive: true });
    await ReactPDF.renderToFile(
      <FullSetDocument data={data} />,
      path.join(dir, "full-set.pdf")
    );
    generated++;
  }

  console.log(
    `Done. Generated ${generated} full-set packages ` +
      `(${withDbProposals} with DB proposals, ${withPhoto} with cover photos; ` +
      `skipped ${skipped} with real client PDFs) in ${outRoot}.`
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
