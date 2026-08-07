"use client";

import useSWR from "swr";

import type { components } from "@/domain-models/generated-schema";
import buildApiClient from "@/domain-models/apiClient";
import { asArray, asRecord } from "@/utils/typeUtils";

type Meeting = components["schemas"]["Meeting"];
type Proposal = components["schemas"]["Proposal"];
type Position = components["schemas"]["Position"];

const UNTITLED_MEETING = "Untitled Meeting";

interface ReportingData {
  meetings: Meeting[];
  proposals: Proposal[];
  positions: Position[];
  directorPerformanceData: DirectorPerformanceData[];
  participationData: ParticipationData;
  yearOverYearData: YearOverYearData[];
  eventSummaryData: EventSummaryData;
  auditComplianceData: AuditComplianceData[];
  quorumData: QuorumData[];
  // Transformed data for UI components
  mappedEventSummary: MappedEventSummary[];
  mappedYearOverYear: MappedYearOverYear[];
  mappedProposalPerformanceData: MappedProposalPerformanceData[];
  mappedAuditComplianceData: MappedAuditComplianceData[];
  mappedQuorumPerformanceData: QuorumData[];
  availableDirectors: string[];
  availableMeetings: { id: string; title: string; year: number | null }[];
}

interface DirectorPerformanceData {
  directorName: string;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  totalVotes: number;
}

/**
 * Voting-method distribution across all positions. Early/Late timing
 * percentages were intentionally removed (002-tabulation-enhancements) —
 * the breakdown is by channel only.
 */
interface ParticipationData {
  webVoting: number;
  printVoting: number;
  ivrVoting: number;
  totalVotes: number;
}

interface YearOverYearData {
  year: number;
  participationRate: number;
  registeredShares: number;
  beneficialShares: number;
  totalShares: number;
}

interface EventSummaryData {
  totalProposals: number;
  passedProposals: number;
  failedProposals: number;
  participationRate: number;
  quorumAchieved: boolean;
  materials: {
    sent: number;
    total: number;
    sentDate: string;
  };
}

interface AuditComplianceData {
  meetingId: string;
  meetingTitle: string;
  complianceScore: number;
  issues: string[];
  materialsCompliant: boolean;
}

interface QuorumData {
  meetingId: string;
  meetingTitle: string;
  requiredShares: number;
  actualShares: number;
  quorumMet: boolean;
  participationRate: number;
  daysToQuorum: number | null;
}

// UI-specific mapped data interfaces
interface MappedEventSummary {
  event: string;
  meetingId?: string;
  meetingType: string;
  inspector: string;
  brokerSearchDate: string;
  recordDate: string;
  filingDate: string;
  mailingDate: string;
  mailingMethod: string;
  votingCutoff: string;
  meetingYear: number;
}

interface MappedYearOverYear {
  year: number;
  participationRate: number;
  registeredShares: number;
  beneficialShares: number;
  totalShares: number;
}

interface MappedProposalPerformanceData {
  type: string;
  totalPresented: string;
  averageSupport: string;
  min: string;
  max: string;
  percentPassed: string;
}

interface MappedAuditComplianceData {
  event: string;
  meetingId?: string;
  materialsSent: string;
  inspectorCertified: string;
  universalProxy: string;
  finalCertified: string;
}

const DIRECTOR_TITLE_PATTERNS = [
  /Election of Director - (?<name>.+)/iu,
  /Election of (?<name>.+) as Director/iu,
  /Director Election: (?<name>.+)/iu,
  /Elect (?<name>.+) as Director/iu,
];

const extractDirectorNameFromTitle = (title: string): string | null => {
  for (const pattern of DIRECTOR_TITLE_PATTERNS) {
    const match = pattern.exec(title);
    const name = match?.groups?.name;
    if (name !== undefined) {
      return name.trim();
    }
  }
  return null;
};

const DIRECTOR_ELECTION_LABEL = "Director Election";

const isDirectorProposal = (proposal: Proposal): boolean => {
  if (
    proposal.proposalType === DIRECTOR_ELECTION_LABEL ||
    proposal.proposalType === "DIRECTOR_ELECTION" ||
    proposal.directorName !== null
  ) {
    return true;
  }
  const title = proposal.proposalTitle ?? "";
  return (
    /Election of Director/iu.test(title) ||
    /Director/iu.test(title) ||
    /Elect/iu.test(title)
  );
};

const calculateDirectorPerformance = (
  proposals: Proposal[]
): DirectorPerformanceData[] => {
  const directorProposals = proposals.filter((p) => isDirectorProposal(p));

  const directorMap = new Map<string, DirectorPerformanceData>();

  for (const proposal of directorProposals) {
    const directorName =
      proposal.directorName ??
      extractDirectorNameFromTitle(proposal.proposalTitle ?? "");
    if (directorName === null || directorName === "") {
      continue;
    }

    const existing = directorMap.get(directorName) ?? {
      directorName,
      forVotes: 0,
      againstVotes: 0,
      abstainVotes: 0,
      totalVotes: 0,
    };

    existing.forVotes += proposal.totalVotesFor ?? 0;
    existing.againstVotes += proposal.totalVotesAgainst ?? 0;
    existing.abstainVotes += proposal.totalVotesAbstain ?? 0;
    existing.totalVotes =
      existing.forVotes + existing.againstVotes + existing.abstainVotes;

    directorMap.set(directorName, existing);
  }

  return [...directorMap.values()];
};

/**
 * Counts positions per voting channel (WEB / PRINT / IVR, defaulting unknown
 * sources to WEB). Early/Late vote-timing splits are no longer computed.
 *
 * @param positions - All positions across the reported meetings
 * @returns Per-channel vote counts and the overall total
 */
const calculateParticipationData = (
  positions: Position[]
): ParticipationData => {
  const votingMethods: Partial<Record<string, number>> = {};
  for (const position of positions) {
    const method = position.source ?? "WEB";
    votingMethods[method] = (votingMethods[method] ?? 0) + 1;
  }

  return {
    webVoting: votingMethods.WEB ?? 0,
    printVoting: votingMethods.PRINT ?? 0,
    ivrVoting: votingMethods.IVR ?? 0,
    totalVotes: positions.length,
  };
};

const calculateYearOverYearData = (
  meetings: Meeting[],
  positions: Position[]
): YearOverYearData[] => {
  const yearMap = new Map<number, YearOverYearData>();

  // `domain-models/generated-schema.ts` is excluded from ESLint's
  // typed-linting program, so the linter's own type resolution for
  // `Meeting` fields here falls back to an error type that reads as `any`
  // — `tsc --noEmit` has no issue with any of this.
  // Only use Annual meetings with a meeting date for the Year-over-Year chart
  /* eslint-disable @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/strict-boolean-expressions */
  const annualMeetings = meetings.filter(
    (m): m is Meeting & { meetingDate: string } =>
      !(m.meetingType ?? "Annual").toLowerCase().includes("special") &&
      m.meetingDate !== undefined
  );
  /* eslint-enable @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/strict-boolean-expressions */

  for (const meeting of annualMeetings) {
    const meetingDate = new Date(meeting.meetingDate);
    const year = meetingDate.getFullYear();

    // Skip if we already have data for this year (take first annual meeting)
    if (yearMap.has(year)) {
      continue;
    }

    const meetingPositions = positions.filter(
      (p) => p.meetingId === meeting.id
    );

    // accountType: 'Non-DTC' = Registered (directly held)
    // accountType: 'DTC/CDS' = Beneficial (street name, held through brokers)
    const registeredShares = meetingPositions
      .filter((p) => p.accountType === "Non-DTC")
      .reduce((sum, p) => sum + (p.sharesVoted ?? 0), 0);

    const beneficialShares = meetingPositions
      .filter((p) => p.accountType === "DTC/CDS")
      .reduce((sum, p) => sum + (p.sharesVoted ?? 0), 0);

    const totalShares = registeredShares + beneficialShares;

    const totalSharesOutstandingNumber = Number(
      meeting.totalSharesOutstanding ?? "0"
    );
    const participationRate =
      totalSharesOutstandingNumber > 0
        ? (totalShares / totalSharesOutstandingNumber) * 100
        : 0;

    yearMap.set(year, {
      year,
      participationRate,
      registeredShares,
      beneficialShares,
      totalShares,
    });
  }

  // .toSorted() isn't supported in this app's oldest targeted browser
  // (Chrome 109); .sort() here is non-mutating anyway since it's sorting a
  // fresh array this function just built.
  // eslint-disable-next-line unicorn/no-array-sort
  return [...yearMap.values()].sort((a, b) => a.year - b.year);
};

const calculateEventSummaryData = (
  meetings: Meeting[],
  proposals: Proposal[],
  positions: Position[]
): EventSummaryData => {
  const [latestMeeting] = meetings;
  if (latestMeeting === undefined) {
    return {
      totalProposals: 0,
      passedProposals: 0,
      failedProposals: 0,
      participationRate: 0,
      quorumAchieved: false,
      materials: { sent: 0, total: 0, sentDate: "" },
    };
  }

  const meetingProposals = proposals.filter(
    (p) => p.meetingId === latestMeeting.id
  );
  const meetingPositions = positions.filter(
    (p) => p.meetingId === latestMeeting.id
  );

  const passedProposals = meetingProposals.filter(
    (p) => p.finalResult === "PASSED"
  ).length;
  const failedProposals = meetingProposals.filter(
    (p) => p.finalResult === "FAILED"
  ).length;

  const totalSharesOutstandingNumber = Number(
    latestMeeting.totalSharesOutstanding ?? "0"
  );
  const actualShares = meetingPositions.reduce(
    (sum, pos) => sum + (pos.sharesVoted ?? 0),
    0
  );
  const participationRate =
    totalSharesOutstandingNumber > 0
      ? (actualShares / totalSharesOutstandingNumber) * 100
      : 0;

  return {
    totalProposals: meetingProposals.length,
    passedProposals,
    failedProposals,
    participationRate,
    quorumAchieved:
      participationRate >= (latestMeeting.quorumRequirement ?? 50),
    materials: {
      sent: meetingPositions.length,
      total:
        totalSharesOutstandingNumber > 0
          ? totalSharesOutstandingNumber
          : meetingPositions.length,
      sentDate: latestMeeting.mailingDate ?? latestMeeting.meetingDate ?? "",
    },
  };
};

const buildComplianceIssues = (
  meeting: Meeting,
  proposalCount: number
): string[] => {
  const issues: string[] = [];
  if (meeting.mailingDate === undefined) {
    issues.push("Materials sent date not recorded");
  }
  if (proposalCount === 0) {
    issues.push("No proposals recorded");
  }
  if (meeting.quorumRequirement === undefined) {
    issues.push("Quorum requirement not set");
  }
  return issues;
};

const calculateAuditComplianceData = (
  meetings: Meeting[],
  proposals: Proposal[]
): AuditComplianceData[] =>
  meetings.map((meeting) => {
    const meetingProposals = proposals.filter(
      (p) => p.meetingId === meeting.id
    );
    const issues = buildComplianceIssues(meeting, meetingProposals.length);
    const complianceScore = Math.max(0, 100 - issues.length * 25);

    return {
      meetingId: meeting.id ?? "",
      meetingTitle: meeting.title ?? UNTITLED_MEETING,
      complianceScore,
      issues,
      materialsCompliant: meeting.mailingDate !== undefined,
    };
  });

// Named groups are read via `match.groups` in parseVoteDate below — the
// linter can't trace that across the two statements.
// prettier-ignore
// eslint-disable-next-line sonarjs/unused-named-groups
const DATED_VOTE_PATTERN = /(?<month>\d{1,2})\/(?<day>\d{1,2})\/(?<year>\d{4})/u;

// Parses the "MM/DD/YYYY HH:MMAM/PM" format used by dateVoted, ignoring time.
const parseVoteDate = (dateString: string): Date => {
  const match = DATED_VOTE_PATTERN.exec(dateString);
  const groups = match?.groups;
  if (groups !== undefined) {
    return new Date(
      Number(groups.year),
      Number(groups.month) - 1,
      Number(groups.day)
    );
  }
  const fallback = new Date(dateString);
  return Number.isNaN(fallback.getTime()) ? new Date() : fallback;
};

const collectDatedVotes = (
  positions: Position[]
): { date: Date; shares: number }[] => {
  const datedVotes: { date: Date; shares: number }[] = [];
  for (const position of positions) {
    const shares = position.sharesVoted ?? 0;
    if (
      position.dateVoted === undefined ||
      position.dateVoted === null ||
      shares <= 0
    ) {
      continue;
    }
    datedVotes.push({ date: parseVoteDate(position.dateVoted), shares });
  }
  // .toSorted() isn't supported in this app's oldest targeted browser
  // (Chrome 109); .sort() here is non-mutating anyway since datedVotes is
  // local to this function.
  // eslint-disable-next-line unicorn/no-array-sort
  return datedVotes.sort((a, b) => a.date.getTime() - b.date.getTime());
};

const calculateDaysToQuorum = (
  meetingPositions: Position[],
  meeting: Meeting
): number | null => {
  const datedVotes = collectDatedVotes(meetingPositions);
  if (datedVotes.length === 0 || meeting.meetingDate === undefined) {
    return null;
  }
  const firstVoteDate = datedVotes[0].date;
  const meetingDate = new Date(meeting.meetingDate);
  const diffMs = meetingDate.getTime() - firstVoteDate.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
};

const calculateQuorumData = (
  meetings: Meeting[],
  positions: Position[]
): QuorumData[] =>
  meetings.map((meeting) => {
    const meetingPositions = positions.filter(
      (p) => p.meetingId === meeting.id
    );
    const actualShares = meetingPositions.reduce(
      (sum, pos) => sum + (pos.sharesVoted ?? 0),
      0
    );

    const totalSharesOutstandingNumber = Number(
      meeting.totalSharesOutstanding ?? "0"
    );
    const requiredShares =
      totalSharesOutstandingNumber * ((meeting.quorumRequirement ?? 50) / 100);
    const participationRate =
      totalSharesOutstandingNumber > 0
        ? (actualShares / totalSharesOutstandingNumber) * 100
        : 0;

    return {
      meetingId: meeting.id ?? "",
      meetingTitle: meeting.title ?? UNTITLED_MEETING,
      requiredShares,
      actualShares,
      quorumMet: actualShares >= requiredShares,
      participationRate,
      daysToQuorum: calculateDaysToQuorum(meetingPositions, meeting),
    };
  });

const buildEventSummaryRow = (meeting: Meeting): MappedEventSummary => {
  let year: number | null = null;
  if (meeting.meetingDate !== undefined) {
    const meetingDate = new Date(meeting.meetingDate);
    year = meetingDate.getFullYear();
  }
  const meetingType = meeting.meetingType ?? "Annual";

  return {
    event: `${meetingType} ${year ?? "Unknown"}`,
    meetingId: meeting.id,
    meetingType,
    inspector: meeting.inspector ?? "",
    brokerSearchDate: meeting.brokerSearchDate ?? "",
    recordDate: meeting.recordDate ?? meeting.meetingDate ?? "",
    filingDate: meeting.filingDate ?? "",
    mailingDate: meeting.mailingDate ?? "",
    mailingMethod: meeting.distributionType ?? "",
    votingCutoff: meeting.cutoffDate ?? "",
    meetingYear: year ?? 0,
  };
};

// UI Transformation functions
const transformEventSummaryData = (
  meetings: Meeting[]
): MappedEventSummary[] => {
  if (meetings.length === 0) {
    return [];
  }

  const results: MappedEventSummary[] = [];
  for (const meeting of meetings) {
    try {
      results.push(buildEventSummaryRow(meeting));
    } catch {
      // Skip invalid meeting data
    }
  }
  return results;
};

const transformYearOverYearData = (
  yearOverYearData: YearOverYearData[]
): MappedYearOverYear[] =>
  yearOverYearData.map((y) => ({
    year: y.year,
    participationRate: y.participationRate,
    registeredShares: y.registeredShares,
    beneficialShares: y.beneficialShares,
    totalShares: y.totalShares,
  }));

const PROPOSAL_TYPE_ALIASES: { pattern: RegExp; label: string }[] = [
  { pattern: /director/iu, label: DIRECTOR_ELECTION_LABEL },
  { pattern: /say.*pay/iu, label: "Say on Pay" },
  { pattern: /auditor/iu, label: "Auditor" },
];

const normalizeProposalType = (rawType: string): string => {
  if (rawType === "DIRECTOR_ELECTION") {
    return DIRECTOR_ELECTION_LABEL;
  }
  if (rawType === "SAY_ON_PAY") {
    return "Say on Pay";
  }
  const alias = PROPOSAL_TYPE_ALIASES.find(({ pattern }) =>
    pattern.test(rawType)
  );
  return alias?.label ?? rawType;
};

interface ProposalTypeAccumulator {
  total: number;
  passed: number;
  support: number[];
}

const accumulateProposalsByType = (
  proposals: Proposal[]
): Record<string, ProposalTypeAccumulator> => {
  const proposalsByType: Record<string, ProposalTypeAccumulator> = {};

  for (const proposal of proposals) {
    const type = normalizeProposalType(proposal.proposalType ?? "Unknown");
    const bucket = proposalsByType[type] ?? {
      total: 0,
      passed: 0,
      support: [],
    };
    bucket.total += 1;
    if (proposal.finalResult === "PASSED") {
      bucket.passed += 1;
    }

    const forVotes = proposal.totalVotesFor ?? 0;
    const againstVotes = proposal.totalVotesAgainst ?? 0;
    const abstainVotes = proposal.totalVotesAbstain ?? 0;
    const totalVotes = forVotes + againstVotes + abstainVotes;
    if (totalVotes > 0) {
      bucket.support.push((forVotes / totalVotes) * 100);
    }

    proposalsByType[type] = bucket;
  }

  return proposalsByType;
};

const transformProposalPerformanceData = (
  proposals: Proposal[]
): MappedProposalPerformanceData[] => {
  const proposalsByType = accumulateProposalsByType(proposals);

  return Object.entries(proposalsByType).map(([type, data]) => {
    const averageSupport =
      data.support.length > 0
        ? data.support.reduce((a, b) => a + b, 0) / data.support.length
        : 0;
    const passRate = data.total > 0 ? (data.passed / data.total) * 100 : 0;
    const minSupport = data.support.length > 0 ? Math.min(...data.support) : 0;
    const maxSupport =
      data.support.length > 0 ? Math.max(...data.support) : 100;

    return {
      type,
      totalPresented: data.total.toString(),
      averageSupport: `${averageSupport.toFixed(1)}%`,
      min: `${minSupport.toFixed(1)}%`,
      max: `${maxSupport.toFixed(1)}%`,
      percentPassed: `${passRate.toFixed(1)}%`,
    };
  });
};

const AUDIT_COMPLIANCE_YEAR_PATTERN = /(?<year>\d{4})$/u;

const transformAuditComplianceData = (
  auditComplianceData: AuditComplianceData[]
): MappedAuditComplianceData[] =>
  auditComplianceData.map((item) => {
    const yearMatch = AUDIT_COMPLIANCE_YEAR_PATTERN.exec(item.meetingId);
    const year = yearMatch?.groups?.year;
    const eventTitle =
      year === undefined ? item.meetingTitle : `${item.meetingTitle} ${year}`;

    return {
      event: eventTitle,
      meetingId: item.meetingId,
      materialsSent: item.materialsCompliant ? "Yes" : "No",
      inspectorCertified: item.complianceScore >= 75 ? "Yes" : "No",
      universalProxy: item.issues.length === 0 ? "Yes" : "No",
      finalCertified: item.complianceScore >= 90 ? "Yes" : "No",
    };
  });

const emptyReportingData = (): ReportingData => ({
  meetings: [],
  proposals: [],
  positions: [],
  directorPerformanceData: [],
  participationData: {
    webVoting: 0,
    printVoting: 0,
    ivrVoting: 0,
    totalVotes: 0,
  },
  yearOverYearData: [],
  eventSummaryData: {
    totalProposals: 0,
    passedProposals: 0,
    failedProposals: 0,
    participationRate: 0,
    quorumAchieved: false,
    materials: { sent: 0, total: 0, sentDate: "" },
  },
  auditComplianceData: [],
  quorumData: [],
  mappedEventSummary: [],
  mappedYearOverYear: [],
  mappedProposalPerformanceData: [],
  mappedAuditComplianceData: [],
  mappedQuorumPerformanceData: [],
  availableDirectors: [],
  availableMeetings: [],
});

type ApiClient = Awaited<ReturnType<typeof buildApiClient>>;

// `Proposal` comes from generated-schema.ts, which is excluded from
// ESLint's typed-linting program; tsc has no issue with any of this.
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
const fetchAllProposals = async (
  apiClient: ApiClient,
  meetingIds: (string | undefined)[]
): Promise<(Proposal & { meetingId?: string })[]> => {
  const results = await Promise.all(
    meetingIds.map(async (meetingId = "") => {
      try {
        return await apiClient.GET("/meetings/{meetingId}/proposals", {
          params: { path: { meetingId } },
        });
      } catch {
        return { data: [] };
      }
    })
  );

  return results.flatMap((response, index) => {
    const meetingId = meetingIds[index];
    const record = asRecord(response.data);
    const list = asArray<Proposal & { meetingId?: string }>(
      record === null ? response.data : record.proposals
    );
    return list.map((p) => ({ ...p, meetingId: p.meetingId ?? meetingId }));
  });
};
/* eslint-enable @typescript-eslint/no-redundant-type-constituents */

const fetchAllPositions = async (
  apiClient: ApiClient,
  meetingIds: (string | undefined)[]
): Promise<Position[]> => {
  const results = await Promise.all(
    meetingIds.map(async (meetingId = "") => {
      try {
        return await apiClient.GET("/positions", {
          params: { query: { meetingId, limit: 4000 } },
        });
      } catch {
        return { data: [] };
      }
    })
  );

  return results.flatMap((response) => {
    const record = asRecord(response.data);
    return asArray<Position>(
      record === null ? response.data : record.positions
    );
  });
};

const fetcher = async (clientTicker: string): Promise<ReportingData> => {
  const apiClient = await buildApiClient();
  const now = new Date();
  const currentYear = now.getFullYear();

  const meetingsResponse = await apiClient.GET("/meetings", {
    params: { query: { ticker: clientTicker } },
  });

  const meetingsRecord = asRecord(meetingsResponse.data);
  const meetingsArray = asArray<Meeting>(
    meetingsRecord === null ? meetingsResponse.data : meetingsRecord.meetings
  );

  if (meetingsArray.length === 0) {
    return emptyReportingData();
  }

  // Filter out future meetings (keep current year and past)
  const allMeetings = meetingsArray.filter((meeting) => {
    const meetingDate =
      meeting.meetingDate === undefined ? null : new Date(meeting.meetingDate);
    const meetingYear =
      meeting.meetingYear ?? meetingDate?.getFullYear() ?? null;
    return meetingYear !== null && meetingYear <= currentYear;
  });

  // Filter to only completed meetings for reporting
  const completedMeetings = allMeetings.filter(
    (meeting) => meeting.status === "COMPLETE"
  );

  // Limit to most recent 20 meetings, fetched in parallel
  const meetingIds = completedMeetings.slice(0, 20).map((m) => m.id);

  const [allProposals, allPositions] = await Promise.all([
    fetchAllProposals(apiClient, meetingIds),
    fetchAllPositions(apiClient, meetingIds),
  ]);

  const directorPerformanceData = calculateDirectorPerformance(allProposals);
  const participationData = calculateParticipationData(allPositions);
  const yearOverYearData = calculateYearOverYearData(
    completedMeetings,
    allPositions
  );
  const eventSummaryData = calculateEventSummaryData(
    completedMeetings,
    allProposals,
    allPositions
  );
  const auditComplianceData = calculateAuditComplianceData(
    completedMeetings,
    allProposals
  );
  const quorumData = calculateQuorumData(completedMeetings, allPositions);

  let mappedEventSummary: MappedEventSummary[] = [];
  try {
    mappedEventSummary = transformEventSummaryData(completedMeetings);
  } catch {
    // Fall back to the empty array from the declaration above.
  }

  let mappedYearOverYear: MappedYearOverYear[] = [];
  try {
    mappedYearOverYear = transformYearOverYearData(yearOverYearData);
  } catch {
    // Fall back to the empty array from the declaration above.
  }

  let mappedProposalPerformanceData: MappedProposalPerformanceData[] = [];
  try {
    mappedProposalPerformanceData =
      transformProposalPerformanceData(allProposals);
  } catch {
    // Fall back to the empty array from the declaration above.
  }

  let mappedAuditComplianceData: MappedAuditComplianceData[] = [];
  try {
    mappedAuditComplianceData =
      transformAuditComplianceData(auditComplianceData);
  } catch {
    // Fall back to the empty array from the declaration above.
  }

  const mappedQuorumPerformanceData = quorumData;
  const availableDirectors = directorPerformanceData.map((d) => d.directorName);
  const availableMeetings = completedMeetings.map((m) => {
    const meetingDate =
      m.meetingDate === undefined ? null : new Date(m.meetingDate);
    return {
      id: m.id ?? "",
      title: m.title ?? UNTITLED_MEETING,
      year: m.meetingYear ?? meetingDate?.getFullYear() ?? null,
    };
  });

  return {
    meetings: completedMeetings,
    proposals: allProposals,
    positions: allPositions,
    directorPerformanceData,
    participationData,
    yearOverYearData,
    eventSummaryData,
    auditComplianceData,
    quorumData,
    mappedEventSummary,
    mappedYearOverYear,
    mappedProposalPerformanceData,
    mappedAuditComplianceData,
    mappedQuorumPerformanceData,
    availableDirectors,
    availableMeetings,
  };
};

export const useReporting = (clientTicker: string) => {
  const { data, error, isLoading } = useSWR(
    clientTicker === "" ? null : ["reporting", clientTicker],
    async ([, ticker]: [string, string]) => await fetcher(ticker),
    {
      dedupingInterval: 60_000,
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  );

  return { data, loading: isLoading, error };
};
