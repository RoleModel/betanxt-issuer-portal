/**
 * Shared proxy-card ballot: the actual voting ballot (reverse of the proxy
 * card), driven by each company's real director nominees and proposals from the
 * database. Used by both the Full Set generator and the NAA (Notice of Internet
 * Availability) generator so the ballot never drifts between them.
 */
import { Page, Polygon, Svg, Text, View } from "@react-pdf/renderer";
import fs from "node:fs";
import path from "node:path";
import React from "react";

const INK = "#1F2933";
const RULE = "#000000";
const GRAY = "#D9D9D9";

// Ballot table geometry (points). YOUR VOTE holds three equal mark columns; the
// BOARD RECOMMENDS column is separated by a continuous vertical rule.
const VOTE_W = 156;
const VOTE_COL_W = VOTE_W / 3;
const REC_W = 74;

export interface Director {
  name: string;
  title: string;
  bio: string;
}

export interface BallotProposal {
  number: number;
  title: string;
  description: string;
  recommendation: string;
}

/** Shared illustrative content, used when the database has no proposals. */
export const FALLBACK_DIRECTORS: Director[] = [
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

export const FALLBACK_PROPOSALS: BallotProposal[] = [
  {
    number: 1,
    title: "Election of Directors",
    description:
      "Vote on the election of eight director nominees, each to serve a one-year term expiring at the 2027 Annual Meeting.",
    recommendation: "FOR",
  },
  {
    number: 2,
    title: "Ratification of Independent Registered Public Accounting Firm",
    description:
      "Ratify the Audit Committee's appointment of the Company's independent registered public accounting firm for the fiscal year.",
    recommendation: "FOR",
  },
  {
    number: 3,
    title: "Advisory Vote to Approve Named Executive Officer Compensation",
    description:
      "A non-binding advisory vote on the compensation of the named executive officers.",
    recommendation: "FOR",
  },
  {
    number: 4,
    title: "Stockholder Proposal",
    description:
      "A stockholder proposal, if properly presented at the Annual Meeting.",
    recommendation: "AGAINST",
  },
];

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

/** Reads a value from the environment, falling back to the issuer-portal .env
 * file so scripts pick up keys when run directly with tsx. */
export function readEnv(name: string): string | null {
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

/** Fetches the real director nominees and proposals for a company's annual
 * meeting from the database (Supabase REST). Returns null when unavailable so
 * the caller can fall back to the shared illustrative content. */
export async function fetchMeetingProposals(
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

/** Builds the bold board-recommendation statement from the real proposals. */
export function recommendationStatement(proposals: BallotProposal[]): string {
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
  return (
    "The Board of Directors recommends that you vote FOR each of the director nominees (Proposal 1)" +
    (forNumbers.length > 0 ? `, FOR ${joinNumbers(forNumbers)}` : "") +
    (againstNumbers.length > 0
      ? ` and AGAINST ${joinNumbers(againstNumbers)}`
      : "") +
    "."
  );
}

const MarkBox: React.FC = () => (
  <View style={{ width: 13, height: 13, borderWidth: 1, borderColor: RULE }} />
);

const VoteCells: React.FC = () => (
  <View style={{ width: VOTE_W, flexDirection: "row" }}>
    {[0, 1, 2].map((slot) => (
      <View key={slot} style={{ width: VOTE_COL_W, alignItems: "center" }}>
        <MarkBox />
      </View>
    ))}
  </View>
);

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

export interface ProxyBallotPageProps {
  readonly legalName: string;
  readonly recordDate: string;
  readonly directors: Director[];
  readonly proposals: BallotProposal[];
}

/** The full ballot page (reverse of the proxy card). */
export const ProxyBallotPage: React.FC<ProxyBallotPageProps> = ({
  legalName,
  recordDate,
  directors,
  proposals,
}) => {
  const others = proposals.filter(
    (proposal) => proposal.title !== "Election of Directors"
  );
  const hasElection = proposals.some(
    (proposal) => proposal.title === "Election of Directors"
  );

  return (
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
          <Text style={{ fontSize: 10, fontWeight: 700, color: RULE }}>X</Text>
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
        {recommendationStatement(proposals).toUpperCase()}
      </Text>

      <BallotTableHeader />
      <RecommendsArrow />
      {hasElection ? (
        <>
          <BallotRow label="1.  Election of Directors" heading />
          <VoteColumnLabels />
          {directors.map((director, index) => (
            <BallotRow
              key={director.name}
              label={`1.${String(index + 1).padStart(2, "0")}  ${
                director.name
              }`}
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
        </>
      ) : null}
      <VoteColumnLabels />
      {others.map((proposal) => (
        <BallotRow
          key={proposal.title}
          label={`${proposal.number}.  ${proposal.title}`}
          rec={proposal.recommendation}
        />
      ))}
      <View style={{ borderTopWidth: 1, borderTopColor: RULE }} />

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
        represented by properly submitted proxies will be voted on such matters
        in the discretion of the Named Proxies.
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
        Only stockholders of record as of the close of business on {recordDate},
        the record date for the meeting, are entitled to receive notice of, and
        to vote at, the meeting.
      </Text>

      <View style={{ marginTop: 24, paddingLeft: 90 }}>
        <Text style={{ fontSize: 8.5, color: INK, lineHeight: 1.5 }}>
          Authorized Signatures - Must be completed for your instructions to be
          executed.
        </Text>
        <Text style={{ fontSize: 8.5, color: INK, lineHeight: 1.5 }}>
          Please sign exactly as your name(s) appears on your account. If held
          in joint tenancy, all persons should sign. Trustees, administrators,
          etc., should include title and authority. Corporations should provide
          full name of corporation and title of authorized officer signing the
          proxy card and/or voting instruction form.
        </Text>
      </View>

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

      {/* legalName retained for callers/telemetry parity with the front card. */}
      {legalName.length === 0 ? <Text> </Text> : null}
    </Page>
  );
};
