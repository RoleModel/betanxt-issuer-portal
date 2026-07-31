import { createOpenAI } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
} from "ai";
import { z } from "zod";

import type { UIMessage } from "ai";
import { auth } from "@/auth";
import { enqueueChatbotAction } from "@/lib/chatbotActionsStore";

export const maxDuration = 30;

const AI_GATEWAY_BASE_URL =
  process.env.AI_GATEWAY_BASE_URL ?? "https://ai-gateway.vercel.sh/v1";
const AI_GATEWAY_MODEL =
  process.env.AI_GATEWAY_MODEL ??
  process.env.OPENAI_MODEL ??
  "openai/gpt-4.1-mini";

type MeetingPage =
  "dashboard" | "agenda" | "mailing" | "tabulation" | "reports";
type QueryEntity =
  | "clients"
  | "meetings"
  | "meeting"
  | "proposals"
  | "tasks"
  | "positions"
  | "tabulationReport";

interface ClientSummary {
  id: string;
  ticker: string;
  name: string;
}

interface MeetingSummary {
  id: string;
  ticker: string;
  title: string;
  status: string;
  meetingType: string;
  meetingYear: number | null;
  meetingDate: string | null;
}

interface ProposalSummary {
  id: string;
  proposalNumber: string;
  title: string;
  directorName: string | null;
  proposalType: string | null;
  managementRecommendation: string;
  finalResult: string;
}

interface TaskSummary {
  taskId: string;
  title: string;
  status: string;
  dueDate: string | null;
  owner: string;
  phaseNumber: number | null;
}

interface PositionSummary {
  name: string;
  accountType: string;
  voteStatus: string;
  shares: number;
  sharesVoted: number;
  source: string;
  controlNumber: string;
}

interface DerivedTabulationReportSummary {
  voteDistribution: {
    dtcVotedShares: number;
    dtcUnvotedShares: number;
    nonDtcVotedShares: number;
    nonDtcUnvotedShares: number;
  };
  positionsVoted: {
    voted: number;
    unvoted: number;
    totalShares: number;
    votedShares: number;
  };
  setKeys: string[];
}

interface ChatAccessContext {
  allowedTickers: string[] | null;
  currentTicker: string | null;
  currentMeetingId: string | null;
}

const INTERNAL_PATH_REGEX = /^\/(?!\/).*/;
const TICKER_PATH_REGEX = /^\/([A-Za-z]{2,5})(?:\/|$)/;
const MAX_QUERY_LIMIT = 25;
const MAX_CONTEXT_MESSAGES = 10;
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";

const getCurrentPath = (request: Request): string => {
  const referer = request.headers.get("referer");

  if (!referer) {
    return "/";
  }

  try {
    return new URL(referer).pathname;
  } catch {
    return "/";
  }
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asString = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const asNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((item) => asString(item))
        .filter((item): item is string => Boolean(item))
    : [];

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, " ")
    .trim();

const extractMeetingYearFromSearch = (search?: string): number | undefined => {
  if (!search) {
    return undefined;
  }

  const match = /\b(19|20)\d{2}\b/.exec(search);
  if (!match) {
    return undefined;
  }

  const year = Number.parseInt(match[0], 10);
  return Number.isFinite(year) ? year : undefined;
};

const extractMeetingTypeFromSearch = (search?: string): string | undefined => {
  if (!search) {
    return undefined;
  }

  const normalizedSearch = normalizeText(search);

  if (normalizedSearch.includes("annual")) {
    return "Annual Meeting";
  }

  if (normalizedSearch.includes("special")) {
    return "Special Meeting";
  }

  return undefined;
};

const extractMeetingSearchTerm = (
  search: string | undefined,
  clientName: string | null,
  clientTicker: string | null,
  meetingYear: number | undefined,
  meetingType: string | undefined
): string => {
  if (!search) {
    return "";
  }

  const removalTerms = new Set(
    [
      "meeting",
      "meetings",
      "tell",
      "ell",
      "me",
      "more",
      "about",
      "show",
      "what",
      "is",
      "are",
      "find",
      "list",
      "for",
      "in",
      "the",
      "a",
      "an",
      "please",
      "details",
      "detail",
      "info",
      "information",
      clientTicker ? clientTicker.toLowerCase() : "",
      meetingYear ? String(meetingYear) : "",
    ].filter(Boolean)
  );

  const phraseRemovals = [
    clientName ? normalizeText(clientName) : "",
    meetingType ? normalizeText(meetingType) : "",
    "tell me more about",
    "tell me about",
    "show me",
  ].filter(Boolean);

  let normalizedSearch = normalizeText(search);

  for (const term of phraseRemovals) {
    normalizedSearch = normalizedSearch.replaceAll(term, " ");
  }

  const filteredTokens = normalizedSearch
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !removalTerms.has(token));

  return filteredTokens.join(" ").trim();
};

const extractTickerFromPath = (path: string): string | null => {
  const match = TICKER_PATH_REGEX.exec(path);
  return match?.[1]?.toUpperCase() ?? null;
};

const extractMeetingIdFromPath = (path: string): string | null => {
  const match = /\/(?:past-)?meeting\/([^/]+)/.exec(path);
  return match?.[1] ?? null;
};

const getChatAccessContext = async (
  currentPath: string
): Promise<ChatAccessContext> => {
  const session = await auth();
  const user = session?.user;

  const unrestrictedTypes = new Set(["ADMIN", "CSM", "RELATIONSHIP_MANAGER"]);
  const isBypassMode = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";

  let allowedTickers: string[] | null = [];

  if (isBypassMode && !user) {
    allowedTickers = null;
  } else if (user?.type && unrestrictedTypes.has(user.type)) {
    allowedTickers = null;
  } else if (user?.clientTickers?.length) {
    allowedTickers = user.clientTickers.map((ticker) => ticker.toUpperCase());
  } else if (user?.client_ticker) {
    allowedTickers = [user.client_ticker.toUpperCase()];
  }

  return {
    allowedTickers,
    currentTicker: extractTickerFromPath(currentPath),
    currentMeetingId: extractMeetingIdFromPath(currentPath),
  };
};

const isTickerAllowed = (
  ticker: string | null | undefined,
  allowedTickers: string[] | null
): boolean => {
  if (!ticker) {
    return true;
  }
  if (allowedTickers === null) {
    return true;
  }
  return allowedTickers.includes(ticker.toUpperCase());
};

const normalizeQueryLimit = (limit: number | undefined): number => {
  if (!limit || !Number.isFinite(limit)) {
    return 10;
  }

  return Math.max(1, Math.min(Math.round(limit), MAX_QUERY_LIMIT));
};

const fetchPortalJson = async (path: string): Promise<unknown> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as unknown;
};

const fetchMeetingPositions = async (
  meetingId: string
): Promise<Record<string, unknown>[]> => {
  const payload = await fetchPortalJson(
    `/positions?meetingId=${meetingId}&limit=50000`
  );
  const root = asRecord(payload);

  return asArray(root?.positions)
    .map((row) => asRecord(row))
    .filter((row): row is Record<string, unknown> => Boolean(row));
};

const getClientAliases = (row: Record<string, unknown>): string[] => {
  const aliases = [
    asString(row.shortName),
    asString(row.short_name),
    asString(row.companyName),
    asString(row.company_name),
  ];

  return aliases.filter(
    (value, index, values): value is string =>
      Boolean(value) && values.indexOf(value) === index
  );
};

const inferTickerFromSearch = async (
  search: string,
  accessContext: ChatAccessContext
): Promise<string | null> => {
  const normalizedSearch = normalizeText(search);
  if (!normalizedSearch) {
    return null;
  }

  const payload = await fetchPortalJson("/clients");
  const root = asRecord(payload);
  const rows = asArray(root?.clients);

  const clients = rows.reduce<{ ticker: string; aliases: string[] }[]>(
    (accumulated, row) => {
      const record = asRecord(row);
      if (!record) {
        return accumulated;
      }
      const ticker = (asString(record.ticker) ?? "").toUpperCase();
      const aliases = getClientAliases(record);
      if (
        ticker &&
        aliases.length > 0 &&
        isTickerAllowed(ticker, accessContext.allowedTickers)
      ) {
        accumulated.push({ ticker, aliases });
      }
      return accumulated;
    },
    []
  );

  const directTickerMatch = clients.find((client) =>
    normalizedSearch.includes(client.ticker.toLowerCase())
  );

  if (directTickerMatch) {
    return directTickerMatch.ticker;
  }

  const bestNameMatch = clients.find((client) =>
    client.aliases.some((alias) => {
      const normalizedAlias = normalizeText(alias);
      return (
        normalizedSearch.includes(normalizedAlias) ||
        normalizedAlias.includes(normalizedSearch)
      );
    })
  );

  if (bestNameMatch) {
    return bestNameMatch.ticker;
  }

  const tokenMatchedClient = clients.find((client) =>
    client.aliases.some((alias) => {
      const normalizedAlias = normalizeText(alias);
      const aliasTokens = normalizedAlias
        .split(" ")
        .map((token) => token.trim())
        .filter(
          (token) => token.length > 2 && token !== "the" && token !== "company"
        );

      return (
        aliasTokens.length > 0 &&
        aliasTokens.every((token) => normalizedSearch.includes(token))
      );
    })
  );

  return tokenMatchedClient?.ticker ?? null;
};

const getClientNameForTicker = async (
  ticker: string,
  accessContext: ChatAccessContext
): Promise<string | null> => {
  const payload = await fetchPortalJson("/clients");
  const root = asRecord(payload);
  const rows = asArray(root?.clients);

  let matchingClient: { ticker: string; aliases: string[] } | null = null;
  for (const row of rows) {
    const record = asRecord(row);
    if (!record) {
      continue;
    }
    const candidateTicker = (asString(record.ticker) ?? "").toUpperCase();
    const aliases = getClientAliases(record);
    if (
      candidateTicker &&
      aliases.length > 0 &&
      isTickerAllowed(candidateTicker, accessContext.allowedTickers) &&
      candidateTicker === ticker.toUpperCase()
    ) {
      matchingClient = { ticker: candidateTicker, aliases };
      break;
    }
  }

  return matchingClient?.aliases[0] ?? null;
};

const deriveTabulationReportSummary = (
  positions: Record<string, unknown>[]
): DerivedTabulationReportSummary => {
  const votedPositions = positions.filter(
    (position) =>
      asString(position.voteStatus ?? position.vote_status) === "Voted"
  );
  const unvotedPositions = positions.filter(
    (position) =>
      asString(position.voteStatus ?? position.vote_status) === "Unvoted"
  );

  const totalShares = positions.reduce(
    (sum, position) => sum + asNumber(position.shares),
    0
  );
  const votedShares = votedPositions.reduce(
    (sum, position) =>
      sum + asNumber(position.sharesVoted ?? position.shares_voted),
    0
  );

  const dtcVotedShares = votedPositions
    .filter(
      (position) =>
        asString(position.accountType ?? position.account_type) === "DTC/CDS"
    )
    .reduce(
      (sum, position) =>
        sum + asNumber(position.sharesVoted ?? position.shares_voted),
      0
    );

  const dtcUnvotedShares = unvotedPositions
    .filter(
      (position) =>
        asString(position.accountType ?? position.account_type) === "DTC/CDS"
    )
    .reduce((sum, position) => sum + asNumber(position.shares), 0);

  const nonDtcVotedShares = votedPositions
    .filter(
      (position) =>
        asString(position.accountType ?? position.account_type) === "Non-DTC"
    )
    .reduce(
      (sum, position) =>
        sum + asNumber(position.sharesVoted ?? position.shares_voted),
      0
    );

  const nonDtcUnvotedShares = unvotedPositions
    .filter(
      (position) =>
        asString(position.accountType ?? position.account_type) === "Non-DTC"
    )
    .reduce((sum, position) => sum + asNumber(position.shares), 0);

  const setKeys = [
    ...new Set(
      positions
        .map((position) => asString(position.setKey ?? position.set_key))
        .filter((value): value is string => Boolean(value))
    ),
  ];

  return {
    voteDistribution: {
      dtcVotedShares,
      dtcUnvotedShares,
      nonDtcVotedShares,
      nonDtcUnvotedShares,
    },
    positionsVoted: {
      voted: votedPositions.length,
      unvoted: unvotedPositions.length,
      totalShares,
      votedShares,
    },
    setKeys,
  };
};

const getMeetingData = async (
  meetingId: string,
  allowedTickers: string[] | null
): Promise<Record<string, unknown>> => {
  const payload = await fetchPortalJson(`/meetings/${meetingId}`);
  const meeting = asRecord(payload);

  if (!meeting) {
    throw new Error(`Meeting ${meetingId} could not be loaded.`);
  }

  const meetingTicker = asString(meeting.ticker)?.toUpperCase() ?? null;
  if (!isTickerAllowed(meetingTicker, allowedTickers)) {
    throw new Error(`You do not have access to meeting ${meetingId}.`);
  }

  return meeting;
};

const resolveClientTicker = (
  requestedTicker: string | undefined,
  accessContext: ChatAccessContext
): string | null => {
  if (requestedTicker) {
    return requestedTicker.toUpperCase();
  }

  if (accessContext.currentTicker) {
    return accessContext.currentTicker;
  }

  if (accessContext.allowedTickers?.length === 1) {
    return accessContext.allowedTickers[0];
  }

  return null;
};

const resolveMeetingId = (
  requestedMeetingId: string | undefined,
  accessContext: ChatAccessContext
): string | null => requestedMeetingId ?? accessContext.currentMeetingId;

const isAllowedNavigationPath = (
  path: string,
  allowedTickers: string[] | null
): boolean => {
  if (!INTERNAL_PATH_REGEX.test(path)) {
    return false;
  }

  const ticker = extractTickerFromPath(path);
  return isTickerAllowed(ticker, allowedTickers);
};

const buildMeetingRoute = (
  currentPath: string,
  nextSegment: string
): string | null => {
  const match = /^\/([^/]+)\/((?:past-)?meeting)\/([^/]+)(?:\/.*)?$/.exec(
    currentPath
  );

  if (!match) {
    return null;
  }

  const [, clientTicker, meetingScope, meetingId] = match;

  return `/${clientTicker}/${meetingScope}/${meetingId}/${nextSegment}`;
};

const getMessageText = (message: UIMessage): string =>
  message.parts
    .flatMap((part) => (part.type === "text" ? [part.text] : []))
    .join("\n")
    .trim();

const sanitizeMessagesForModel = (messages: UIMessage[]): UIMessage[] =>
  messages.slice(-MAX_CONTEXT_MESSAGES).map((message) => {
    const text = getMessageText(message);

    return {
      id: message.id,
      role: message.role,
      parts: text
        ? [
            {
              type: "text" as const,
              text,
            },
          ]
        : [],
    };
  });

const getFallbackAssistantReply = (
  messages: UIMessage[],
  currentPath: string
): string => {
  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");

  const prompt = latestUserMessage
    ? getMessageText(latestUserMessage).toLowerCase()
    : "";

  if (
    prompt.includes("support") ||
    prompt.includes("contact") ||
    prompt.includes("help desk")
  ) {
    enqueueChatbotAction({
      type: "OPEN_SUPPORT_CONTACTS",
    });

    return "Opening support contacts.";
  }

  const pageMatches: { page: MeetingPage; keywords: string[] }[] = [
    { page: "dashboard", keywords: ["dashboard"] },
    { page: "agenda", keywords: ["agenda"] },
    { page: "mailing", keywords: ["mailing"] },
    { page: "tabulation", keywords: ["tabulation"] },
    { page: "reports", keywords: ["reports", "report"] },
  ];

  const matchedPage = pageMatches.find(({ keywords }) =>
    keywords.some((keyword) => prompt.includes(keyword))
  );

  if (matchedPage) {
    const nextSegment =
      matchedPage.page === "dashboard" ? "dashboard/1" : matchedPage.page;
    const path = buildMeetingRoute(currentPath, nextSegment);

    if (path) {
      enqueueChatbotAction({
        type: "NAVIGATE",
        payload: { path },
      });

      return `Taking you to ${matchedPage.page}.`;
    }

    return `I can navigate to ${matchedPage.page} when you are on a meeting page.`;
  }

  return "AI Gateway is not configured yet. I can still open support contacts or navigate to dashboard, agenda, mailing, tabulation, and reports.";
};

const createFallbackResponse = (
  messages: UIMessage[],
  currentPath: string
): Response => {
  const content = getFallbackAssistantReply(messages, currentPath);
  const stream = createUIMessageStream({
    originalMessages: messages,
    execute: ({ writer }) => {
      const textId = `fallback-${Date.now()}`;

      writer.write({
        type: "text-start",
        id: textId,
      });
      writer.write({
        type: "text-delta",
        id: textId,
        delta: content,
      });
      writer.write({
        type: "text-end",
        id: textId,
      });
    },
  });

  return createUIMessageStreamResponse({ stream });
};

const createAssistantTextResponse = (
  messages: UIMessage[],
  content: string
): Response => {
  const stream = createUIMessageStream({
    originalMessages: messages,
    execute: ({ writer }) => {
      const textId = `assistant-${Date.now()}`;

      writer.write({
        type: "text-start",
        id: textId,
      });
      writer.write({
        type: "text-delta",
        id: textId,
        delta: content,
      });
      writer.write({
        type: "text-end",
        id: textId,
      });
    },
  });

  return createUIMessageStreamResponse({ stream });
};

const buildChatModel = () => {
  if (!process.env.AI_GATEWAY_API_KEY) {
    return null;
  }

  const gateway = createOpenAI({
    apiKey: process.env.AI_GATEWAY_API_KEY,
    baseURL: AI_GATEWAY_BASE_URL,
  });

  return gateway.chat(AI_GATEWAY_MODEL);
};

const tryHandleMeetingOverviewPrompt = async ({
  messages,
  sanitizedMessages,
  accessContext,
}: {
  messages: UIMessage[];
  sanitizedMessages: UIMessage[];
  accessContext: ChatAccessContext;
}): Promise<Response | null> => {
  const latestUserMessage = [...sanitizedMessages]
    .reverse()
    .find((message) => message.role === "user");

  if (!latestUserMessage) {
    return null;
  }

  const prompt = getMessageText(latestUserMessage);
  const normalizedPrompt = normalizeText(prompt);

  if (
    !normalizedPrompt.includes("meeting") ||
    (!extractMeetingYearFromSearch(prompt) &&
      !extractMeetingTypeFromSearch(prompt))
  ) {
    return null;
  }

  const inferredTicker = await inferTickerFromSearch(prompt, accessContext);
  const resolvedTicker = resolveClientTicker(
    inferredTicker ?? undefined,
    accessContext
  );
  const meetingYear = extractMeetingYearFromSearch(prompt);

  if (!resolvedTicker || !meetingYear) {
    return null;
  }

  const meetingResults = await executePortalQuery({
    entity: "meetings",
    clientTicker: resolvedTicker,
    meetingYear,
    search: prompt,
    limit: 5,
    accessContext,
  });

  const meetingResultRecord = asRecord(meetingResults);
  const meetings = asArray(meetingResultRecord?.meetings)
    .map((meeting) => asRecord(meeting))
    .filter((meeting): meeting is Record<string, unknown> => Boolean(meeting));

  if (meetings.length === 0) {
    return null;
  }

  const selectedMeeting =
    meetings.length === 1
      ? meetings[0]
      : (meetings.find((meeting) =>
          normalizeText(asString(meeting.meetingType) ?? "").includes(
            normalizeText(extractMeetingTypeFromSearch(prompt) ?? "")
          )
        ) ?? meetings[0]);

  const meetingId = asString(selectedMeeting.id);

  if (!meetingId) {
    return null;
  }

  const meeting = await getMeetingData(meetingId, accessContext.allowedTickers);
  const title = asString(meeting.title) ?? "Meeting";
  const ticker = (asString(meeting.ticker) ?? resolvedTicker).toUpperCase();
  const meetingType =
    asString(meeting.meetingType) ??
    asString(meeting.meeting_type) ??
    "Meeting";
  const status = asString(meeting.status) ?? "UNKNOWN";
  const cusip = asString(meeting.cusip) ?? "Unavailable";
  const currentPhase =
    asString(meeting.currentPhase) ??
    asString(meeting.current_phase) ??
    "Unavailable";
  const meetingDate =
    asString(meeting.meetingDate) ?? asString(meeting.meeting_date);
  const recordDate =
    asString(meeting.recordDate) ?? asString(meeting.record_date);
  const mailingDate =
    asString(meeting.mailingDate) ?? asString(meeting.mailing_date);
  const quorumRequirement = asNumber(
    meeting.quorumRequirement ?? meeting.quorum_requirement
  );
  const totalSharesOutstanding = asNumber(
    meeting.totalSharesOutstanding ?? meeting.total_shares_outstanding
  );

  const content = [
    `${title} for ${ticker} is in the portal.`,
    `${meetingType} (${meetingYear})`,
    `Status: ${status}`,
    `CUSIP: ${cusip}`,
    `Current phase: ${currentPhase}`,
    meetingDate ? `Meeting date: ${meetingDate}` : null,
    recordDate ? `Record date: ${recordDate}` : null,
    mailingDate ? `Mailing date: ${mailingDate}` : null,
    quorumRequirement ? `Quorum requirement: ${quorumRequirement}%` : null,
    totalSharesOutstanding
      ? `Total shares outstanding: ${totalSharesOutstanding.toLocaleString()}`
      : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");

  return createAssistantTextResponse(messages, content);
};

const tryHandleDirectorSlatePrompt = async ({
  messages,
  sanitizedMessages,
  accessContext,
}: {
  messages: UIMessage[];
  sanitizedMessages: UIMessage[];
  accessContext: ChatAccessContext;
}): Promise<Response | null> => {
  const latestUserMessage = [...sanitizedMessages]
    .reverse()
    .find((message) => message.role === "user");

  if (!latestUserMessage) {
    return null;
  }

  const prompt = normalizeText(getMessageText(latestUserMessage));

  if (
    !prompt.includes("director slate") &&
    !prompt.includes("directors slate") &&
    !prompt.includes("director nominees")
  ) {
    return null;
  }

  const resolvedMeetingId = resolveMeetingId(undefined, accessContext);

  if (!resolvedMeetingId) {
    return null;
  }

  const proposalResults = await executePortalQuery({
    entity: "proposals",
    meetingId: resolvedMeetingId,
    accessContext,
    limit: MAX_QUERY_LIMIT,
  });

  const proposalResultRecord = asRecord(proposalResults);
  const proposals = asArray(proposalResultRecord?.proposals)
    .map((proposal) => asRecord(proposal))
    .filter((proposal): proposal is Record<string, unknown> =>
      Boolean(proposal)
    );

  const directorSlate = proposals.filter((proposal) => {
    const directorName = asString(proposal.directorName);
    const proposalType = normalizeText(asString(proposal.proposalType) ?? "");
    const title = normalizeText(asString(proposal.title) ?? "");

    return (
      Boolean(directorName) ||
      proposalType.includes("director") ||
      title.includes("director")
    );
  });

  if (directorSlate.length === 0) {
    return null;
  }

  const lines = directorSlate.map((proposal) => {
    const proposalNumber = asString(proposal.proposalNumber) ?? "";
    const title = asString(proposal.title) ?? "";
    const directorName = asString(proposal.directorName);
    const recommendation = asString(proposal.managementRecommendation) ?? "N/A";
    const label = directorName || title;

    return `${proposalNumber}: ${label} (Management recommendation: ${recommendation})`;
  });

  return createAssistantTextResponse(
    messages,
    ["The director slate for this meeting is:", ...lines].join("\n")
  );
};

const executePortalQuery = async ({
  entity,
  clientTicker,
  meetingId,
  meetingYear,
  search,
  limit,
  accessContext,
}: {
  entity: QueryEntity;
  clientTicker?: string;
  meetingId?: string;
  meetingYear?: number;
  search?: string;
  limit?: number;
  accessContext: ChatAccessContext;
}) => {
  const normalizedSearch = search?.trim().toLowerCase() ?? "";
  const cappedLimit = normalizeQueryLimit(limit);

  switch (entity) {
    case "clients": {
      const payload = await fetchPortalJson("/clients");
      const root = asRecord(payload);
      const rows = Array.isArray(root?.clients) ? root.clients : [];
      const clients = rows.reduce<ClientSummary[]>((accumulated, row) => {
        const record = asRecord(row);
        if (!record) {
          return accumulated;
        }
        const client: ClientSummary = {
          id: asString(record.id) ?? "",
          ticker: (asString(record.ticker) ?? "").toUpperCase(),
          name:
            asString(record.companyName) ??
            asString(record.company_name) ??
            asString(record.shortName) ??
            asString(record.short_name) ??
            "",
        };
        if (!(client.id && client.ticker && client.name)) {
          return accumulated;
        }
        if (!isTickerAllowed(client.ticker, accessContext.allowedTickers)) {
          return accumulated;
        }
        if (
          !normalizedSearch ||
          client.name.toLowerCase().includes(normalizedSearch) ||
          client.ticker.toLowerCase().includes(normalizedSearch)
        ) {
          accumulated.push(client);
        }
        return accumulated;
      }, []);

      return {
        entity,
        count: clients.length,
        clients: clients.slice(0, cappedLimit),
      };
    }

    case "meetings": {
      const inferredTicker =
        !clientTicker && normalizedSearch
          ? await inferTickerFromSearch(normalizedSearch, accessContext)
          : null;
      const resolvedTicker = resolveClientTicker(
        clientTicker ?? inferredTicker ?? undefined,
        accessContext
      );
      if (!resolvedTicker) {
        return {
          error:
            "Provide a client ticker or ask this while viewing a client page to query meetings.",
        };
      }

      if (!isTickerAllowed(resolvedTicker, accessContext.allowedTickers)) {
        return { error: `You do not have access to client ${resolvedTicker}.` };
      }

      const resolvedMeetingYear =
        meetingYear ?? extractMeetingYearFromSearch(search);
      const requestedMeetingType = extractMeetingTypeFromSearch(search);
      const clientName = await getClientNameForTicker(
        resolvedTicker,
        accessContext
      );
      const normalizedMeetingSearch = extractMeetingSearchTerm(
        search,
        clientName,
        resolvedTicker,
        resolvedMeetingYear,
        requestedMeetingType
      );

      const queryParameters = new URLSearchParams({ ticker: resolvedTicker });

      if (
        typeof resolvedMeetingYear === "number" &&
        Number.isFinite(resolvedMeetingYear)
      ) {
        queryParameters.set(
          "meetingYear",
          String(Math.trunc(resolvedMeetingYear))
        );
      }

      const payload = await fetchPortalJson(
        `/meetings?${queryParameters.toString()}`
      );
      const root = asRecord(payload);
      const rows = Array.isArray(root?.meetings) ? root.meetings : [];
      const meetings = rows.reduce<MeetingSummary[]>((accumulated, row) => {
        const record = asRecord(row);
        if (!record) {
          return accumulated;
        }
        const meeting: MeetingSummary = {
          id: asString(record.id) ?? "",
          ticker: (asString(record.ticker) ?? resolvedTicker).toUpperCase(),
          title: asString(record.title) ?? "",
          status: asString(record.status) ?? "UNKNOWN",
          meetingType:
            asString(record.meetingType) ??
            asString(record.meeting_type) ??
            "Meeting",
          meetingYear:
            record.meetingYear === undefined
              ? asNumber(record.meeting_year)
              : asNumber(record.meetingYear),
          meetingDate:
            asString(record.meetingDate) ??
            asString(record.meeting_date) ??
            null,
        };
        if (!(meeting.id && meeting.title)) {
          return accumulated;
        }
        if (
          requestedMeetingType &&
          normalizeText(meeting.meetingType) !==
            normalizeText(requestedMeetingType)
        ) {
          return accumulated;
        }
        if (
          !normalizedMeetingSearch ||
          normalizeText(meeting.title).includes(normalizedMeetingSearch) ||
          normalizeText(meeting.id).includes(normalizedMeetingSearch) ||
          normalizeText(meeting.status).includes(normalizedMeetingSearch) ||
          normalizeText(meeting.meetingType).includes(
            normalizedMeetingSearch
          ) ||
          String(meeting.meetingYear ?? "").includes(normalizedMeetingSearch)
        ) {
          accumulated.push(meeting);
        }
        return accumulated;
      }, []);

      return {
        entity,
        clientTicker: resolvedTicker,
        meetingYear: resolvedMeetingYear ?? null,
        count: meetings.length,
        meetings: meetings.slice(0, cappedLimit),
      };
    }

    case "meeting": {
      const resolvedMeetingId = resolveMeetingId(meetingId, accessContext);
      if (!resolvedMeetingId) {
        return {
          error:
            "Provide a meetingId or ask this while viewing a meeting page.",
        };
      }

      const meeting = await getMeetingData(
        resolvedMeetingId,
        accessContext.allowedTickers
      );

      return {
        entity,
        meeting: {
          id: asString(meeting.id) ?? resolvedMeetingId,
          ticker: asString(meeting.ticker) ?? "",
          title: asString(meeting.title) ?? "",
          status: asString(meeting.status) ?? "",
          meetingType:
            asString(meeting.meetingType) ??
            asString(meeting.meeting_type) ??
            "",
          meetingDate:
            asString(meeting.meetingDate) ??
            asString(meeting.meeting_date) ??
            null,
          recordDate:
            asString(meeting.recordDate) ??
            asString(meeting.record_date) ??
            null,
          mailingDate:
            asString(meeting.mailingDate) ??
            asString(meeting.mailing_date) ??
            null,
          quorumRequirement: asNumber(
            meeting.quorumRequirement ?? meeting.quorum_requirement
          ),
          totalSharesOutstanding: asNumber(
            meeting.totalSharesOutstanding ?? meeting.total_shares_outstanding
          ),
        },
      };
    }

    case "proposals": {
      const resolvedMeetingId = resolveMeetingId(meetingId, accessContext);
      if (!resolvedMeetingId) {
        return {
          error:
            "Provide a meetingId or ask this while viewing a meeting page.",
        };
      }

      await getMeetingData(resolvedMeetingId, accessContext.allowedTickers);
      const payload = await fetchPortalJson(
        `/meetings/${resolvedMeetingId}/proposals`
      );
      const rows = Array.isArray(payload) ? payload : [];
      const proposals = rows.reduce<ProposalSummary[]>((accumulated, row) => {
        const record = asRecord(row);
        if (!record) {
          return accumulated;
        }
        const proposal: ProposalSummary = {
          id: asString(record.id) ?? "",
          proposalNumber:
            asString(record.proposalNumber) ??
            asString(record.proposal_number) ??
            asString(record.itemNo) ??
            "",
          title:
            asString(record.title) ??
            asString(record.proposalTitle) ??
            asString(record.proposal_title) ??
            asString(record.directorName) ??
            asString(record.director_name) ??
            "",
          directorName:
            asString(record.directorName) ??
            asString(record.director_name) ??
            null,
          proposalType:
            asString(record.proposalType) ??
            asString(record.proposal_type) ??
            null,
          managementRecommendation:
            asString(record.managementRecommendation) ??
            asString(record.management_recommendation) ??
            asString(record.recommendation) ??
            "",
          finalResult:
            asString(record.finalResult) ?? asString(record.final_result) ?? "",
        };
        if (!(proposal.id || proposal.title)) {
          return accumulated;
        }
        if (
          !normalizedSearch ||
          proposal.title.toLowerCase().includes(normalizedSearch) ||
          proposal.proposalNumber.toLowerCase().includes(normalizedSearch) ||
          proposal.finalResult.toLowerCase().includes(normalizedSearch) ||
          (proposal.directorName?.toLowerCase().includes(normalizedSearch) ??
            false) ||
          (proposal.proposalType?.toLowerCase().includes(normalizedSearch) ??
            false)
        ) {
          accumulated.push(proposal);
        }
        return accumulated;
      }, []);

      return {
        entity,
        meetingId: resolvedMeetingId,
        count: proposals.length,
        proposals: proposals.slice(0, cappedLimit),
      };
    }

    case "tasks": {
      const resolvedMeetingId = resolveMeetingId(meetingId, accessContext);
      if (!resolvedMeetingId) {
        return {
          error:
            "Provide a meetingId or ask this while viewing a meeting page.",
        };
      }

      await getMeetingData(resolvedMeetingId, accessContext.allowedTickers);
      const payload = await fetchPortalJson(
        `/meetings/${resolvedMeetingId}/tasks`
      );
      const rows = Array.isArray(payload) ? payload : [];
      const tasks = rows.reduce<TaskSummary[]>((accumulated, row) => {
        const record = asRecord(row);
        if (!record) {
          return accumulated;
        }
        const task: TaskSummary = {
          taskId:
            asString(record.taskId) ??
            asString(record.task_id) ??
            asString(record.id) ??
            "",
          title: asString(record.title) ?? "",
          status: asString(record.status) ?? "",
          dueDate:
            asString(record.dueDate) ?? asString(record.due_date) ?? null,
          owner: asString(record.owner) ?? "",
          phaseNumber:
            record.phaseNumber === undefined
              ? asNumber(record.phase_number)
              : asNumber(record.phaseNumber),
        };
        if (!(task.taskId || task.title)) {
          return accumulated;
        }
        if (
          !normalizedSearch ||
          task.title.toLowerCase().includes(normalizedSearch) ||
          task.status.toLowerCase().includes(normalizedSearch) ||
          task.owner.toLowerCase().includes(normalizedSearch)
        ) {
          accumulated.push(task);
        }
        return accumulated;
      }, []);

      return {
        entity,
        meetingId: resolvedMeetingId,
        count: tasks.length,
        tasks: tasks.slice(0, cappedLimit),
      };
    }

    case "positions": {
      const resolvedMeetingId = resolveMeetingId(meetingId, accessContext);
      if (!resolvedMeetingId) {
        return {
          error:
            "Provide a meetingId or ask this while viewing a meeting page.",
        };
      }

      await getMeetingData(resolvedMeetingId, accessContext.allowedTickers);
      const payload = await fetchPortalJson(
        `/positions?meetingId=${resolvedMeetingId}&limit=50000`
      );
      const root = asRecord(payload);
      const rows = Array.isArray(payload) ? payload : asArray(root?.positions);
      const positions = rows.reduce<PositionSummary[]>((accumulated, row) => {
        const record = asRecord(row);
        if (!record) {
          return accumulated;
        }
        const position: PositionSummary = {
          name: asString(record.name) ?? "",
          accountType:
            asString(record.accountType) ?? asString(record.account_type) ?? "",
          voteStatus:
            asString(record.voteStatus) ?? asString(record.vote_status) ?? "",
          shares: asNumber(record.shares),
          sharesVoted: asNumber(record.sharesVoted ?? record.shares_voted),
          source: asString(record.source) ?? "",
          controlNumber:
            asString(record.controlNumber) ??
            asString(record.control_number) ??
            "",
        };
        if (!position.name) {
          return accumulated;
        }
        if (
          !normalizedSearch ||
          position.name.toLowerCase().includes(normalizedSearch) ||
          position.accountType.toLowerCase().includes(normalizedSearch) ||
          position.voteStatus.toLowerCase().includes(normalizedSearch) ||
          position.controlNumber.toLowerCase().includes(normalizedSearch)
        ) {
          accumulated.push(position);
        }
        return accumulated;
      }, []);

      return {
        entity,
        meetingId: resolvedMeetingId,
        count: positions.length,
        positions: positions.slice(0, cappedLimit),
      };
    }

    case "tabulationReport": {
      const resolvedMeetingId = resolveMeetingId(meetingId, accessContext);
      if (!resolvedMeetingId) {
        return {
          error:
            "Provide a meetingId or ask this while viewing a meeting page.",
        };
      }

      await getMeetingData(resolvedMeetingId, accessContext.allowedTickers);
      try {
        const payload = await fetchPortalJson(
          `/meetings/${resolvedMeetingId}/tabulation-report`
        );
        const report = asRecord(payload);
        if (!report) {
          throw new Error(
            `Tabulation report for ${resolvedMeetingId} is unavailable.`
          );
        }

        return {
          entity,
          meetingId: resolvedMeetingId,
          source: "tabulation-report",
          voteDistribution: asRecord(report.voteDistribution),
          positionsVoted: asRecord(report.positionsVoted),
          setKeys: asStringArray(report.setKeys),
        };
      } catch {
        const positions = await fetchMeetingPositions(resolvedMeetingId);
        const fallbackReport = deriveTabulationReportSummary(positions);

        return {
          entity,
          meetingId: resolvedMeetingId,
          source: "positions-fallback",
          voteDistribution: fallbackReport.voteDistribution,
          positionsVoted: fallbackReport.positionsVoted,
          setKeys: fallbackReport.setKeys,
        };
      }
    }
  }
};

export async function POST(request: Request) {
  try {
    const { messages } = (await request.json()) as {
      messages?: UIMessage[];
    };

    if (!messages || messages.length === 0) {
      return new Response("Ask a question to get started.", { status: 400 });
    }

    const sanitizedMessages = sanitizeMessagesForModel(messages).filter(
      (message) => message.parts.length > 0
    );

    if (sanitizedMessages.length === 0) {
      return new Response("Ask a question to get started.", { status: 400 });
    }

    const currentPath = getCurrentPath(request);
    const accessContext = await getChatAccessContext(currentPath);
    const model = buildChatModel();

    const deterministicMeetingResponse = await tryHandleMeetingOverviewPrompt({
      messages,
      sanitizedMessages,
      accessContext,
    });

    if (deterministicMeetingResponse) {
      return deterministicMeetingResponse;
    }

    const deterministicDirectorSlateResponse =
      await tryHandleDirectorSlatePrompt({
        messages,
        sanitizedMessages,
        accessContext,
      });

    if (deterministicDirectorSlateResponse) {
      return deterministicDirectorSlateResponse;
    }

    if (!model) {
      return createFallbackResponse(messages, currentPath);
    }

    const tools = {
      navigateToPath: {
        description:
          "Navigate to any internal issuer portal path. Use absolute app paths such as /events, /profile, /CALC/past-meetings, or /CALC/meeting/calc-special-meeting-2026/reports.",
        inputSchema: z.object({
          path: z.string(),
        }),
        execute: ({ path }: { path: string }) => {
          if (!isAllowedNavigationPath(path, accessContext.allowedTickers)) {
            return {
              error:
                "That path is not allowed. Only internal app paths are supported, and ticker routes must be for clients the user can access.",
            };
          }

          enqueueChatbotAction({
            type: "NAVIGATE",
            payload: { path },
          });

          return {
            success: true,
            message: `Navigating to ${path}.`,
            path,
          };
        },
      },
      navigateToMeetingPage: {
        description:
          "Navigate to a meeting page in the issuer portal for dashboard, agenda, mailing, tabulation, or reports.",
        inputSchema: z.object({
          page: z.enum([
            "dashboard",
            "agenda",
            "mailing",
            "tabulation",
            "reports",
          ]),
        }),
        execute: ({ page }: { page: MeetingPage }) => {
          const nextSegment = page === "dashboard" ? "dashboard/1" : page;
          const path = buildMeetingRoute(currentPath, nextSegment);

          if (!path) {
            return {
              error:
                "The user is not currently on a meeting route that can be navigated from.",
            };
          }

          if (!isAllowedNavigationPath(path, accessContext.allowedTickers)) {
            return {
              error: `The user does not have access to ${path}.`,
            };
          }

          enqueueChatbotAction({
            type: "NAVIGATE",
            payload: { path },
          });

          return {
            success: true,
            message: `Taking the user to ${page}.`,
            path,
          };
        },
      },
      openSupportContacts: {
        description: "Open the support contacts popover in the issuer portal.",
        inputSchema: z.object({}),
        execute: () => {
          enqueueChatbotAction({
            type: "OPEN_SUPPORT_CONTACTS",
          });

          return {
            success: true,
            message: "Opening support contacts.",
          };
        },
      },
      queryPortalData: {
        description:
          "Query issuer portal database-backed information for the clients the current user can access. Supports clients, meetings, meeting, proposals, tasks, positions, and tabulationReport.",
        inputSchema: z.object({
          entity: z.enum([
            "clients",
            "meetings",
            "meeting",
            "proposals",
            "tasks",
            "positions",
            "tabulationReport",
          ]),
          clientTicker: z.string().optional(),
          meetingId: z.string().optional(),
          meetingYear: z.number().int().min(1900).max(2100).optional(),
          search: z.string().optional(),
          limit: z.number().int().positive().max(MAX_QUERY_LIMIT).optional(),
        }),
        execute: async ({
          entity,
          clientTicker,
          meetingId,
          meetingYear,
          search,
          limit,
        }: {
          entity: QueryEntity;
          clientTicker?: string;
          meetingId?: string;
          meetingYear?: number;
          search?: string;
          limit?: number;
        }) => {
          try {
            return await executePortalQuery({
              entity,
              clientTicker,
              meetingId,
              meetingYear,
              search,
              limit,
              accessContext,
            });
          } catch (error) {
            return {
              error: Error.isError(error)
                ? error.message
                : "The portal data query failed.",
            };
          }
        },
      },
    };

    const result = streamText({
      model,
      stopWhen: stepCountIs(4),
      messages: await convertToModelMessages(sanitizedMessages),
      tools,
      system: `You are the BetaNXT Issuer Portal assistant. You help users navigate the issuer portal, answer questions with portal data, and access support.

You can:
- query portal data for clients the user can access
- navigate to any internal issuer portal view
- open support contacts

Important:
1. Use queryPortalData whenever the user asks about meetings, proposals, tasks, positions, reports, vote counts, or other portal data.
1a. For questions about meetings in a specific year, pass meetingYear to queryPortalData.
1b. If the user names a company instead of a ticker, use the company phrase in search so the tool can infer the client.
1c. If the user asks about annual or special meetings, preserve that intent in search so the tool can resolve the meeting type.
2. Never invent database values. If you need portal data, query it.
3. If a user asks to go somewhere in the portal, use navigateToPath or navigateToMeetingPage instead of only describing the route.
4. If a user asks for support or contacts, use the support tool.
5. Keep answers concise and grounded in the returned tool data.
6. Respect access boundaries. Do not claim access to client data unless it is returned by the tools.`,
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
    });
  } catch (error) {
    console.error("Chat assistant failed:", error);
    return new Response("The assistant is unavailable right now.", {
      status: 500,
    });
  }
}
