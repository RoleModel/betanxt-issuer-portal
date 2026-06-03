import { createOpenAI } from "@ai-sdk/openai";
import {
  type UIMessage,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
} from "ai";
import { z } from "zod";

import { auth } from "@/auth";
import { enqueueChatbotAction } from "@/lib/chatbotActionsStore";

export const maxDuration = 30;

const AI_GATEWAY_BASE_URL = process.env.AI_GATEWAY_BASE_URL ?? "https://ai-gateway.vercel.sh/v1";
const AI_GATEWAY_MODEL =
  process.env.AI_GATEWAY_MODEL ?? process.env.OPENAI_MODEL ?? "openai/gpt-4.1-mini";

type MeetingPage = "dashboard" | "agenda" | "mailing" | "tabulation" | "reports";
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
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";

const getCurrentPath = (request: Request): string => {
  const referer = request.headers.get("referer");

  if (!referer) {
    return "/";
  }

  try {
    return new URL(referer).pathname;
  } catch (_error) {
    return "/";
  }
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
};

const asString = (value: unknown): string | null => {
  return typeof value === "string" ? value : null;
};

const asNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const asStringArray = (value: unknown): string[] => {
  return Array.isArray(value)
    ? value.map((item) => asString(item)).filter((item): item is string => Boolean(item))
    : [];
};

const asArray = (value: unknown): unknown[] => {
  return Array.isArray(value) ? value : [];
};

const normalizeText = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
};

const extractMeetingYearFromSearch = (search?: string): number | undefined => {
  if (!search) return undefined;

  const match = /\b(19|20)\d{2}\b/.exec(search);
  if (!match) return undefined;

  const year = Number.parseInt(match[0], 10);
  return Number.isFinite(year) ? year : undefined;
};

const extractMeetingTypeFromSearch = (search?: string): string | undefined => {
  if (!search) return undefined;

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
  meetingType: string | undefined,
): string => {
  if (!search) return "";

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
    ].filter(Boolean),
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

const getChatAccessContext = async (currentPath: string): Promise<ChatAccessContext> => {
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
  allowedTickers: string[] | null,
): boolean => {
  if (!ticker) return true;
  if (allowedTickers === null) return true;
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

const fetchMeetingPositions = async (meetingId: string): Promise<Record<string, unknown>[]> => {
  const payload = await fetchPortalJson(`/positions?meetingId=${meetingId}&limit=50000`);
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

  return aliases.filter((value, index, values): value is string => {
    return Boolean(value) && values.indexOf(value) === index;
  });
};

const inferTickerFromSearch = async (
  search: string,
  accessContext: ChatAccessContext,
): Promise<string | null> => {
  const normalizedSearch = normalizeText(search);
  if (!normalizedSearch) return null;

  const payload = await fetchPortalJson("/clients");
  const root = asRecord(payload);
  const rows = asArray(root?.clients);

  const clients = rows
    .map((row) => asRecord(row))
    .filter((row): row is Record<string, unknown> => Boolean(row))
    .map((row) => ({
      ticker: (asString(row.ticker) ?? "").toUpperCase(),
      aliases: getClientAliases(row),
    }))
    .filter((client) => client.ticker && client.aliases.length > 0)
    .filter((client) => isTickerAllowed(client.ticker, accessContext.allowedTickers));

  const directTickerMatch = clients.find((client) =>
    normalizedSearch.includes(client.ticker.toLowerCase()),
  );

  if (directTickerMatch) {
    return directTickerMatch.ticker;
  }

  const bestNameMatch = clients.find((client) => {
    return client.aliases.some((alias) => {
      const normalizedAlias = normalizeText(alias);
      return (
        normalizedSearch.includes(normalizedAlias) || normalizedAlias.includes(normalizedSearch)
      );
    });
  });

  if (bestNameMatch) {
    return bestNameMatch.ticker;
  }

  const tokenMatchedClient = clients.find((client) => {
    return client.aliases.some((alias) => {
      const normalizedAlias = normalizeText(alias);
      const aliasTokens = normalizedAlias
        .split(" ")
        .map((token) => token.trim())
        .filter((token) => token.length > 2 && token !== "the" && token !== "company");

      return (
        aliasTokens.length > 0 && aliasTokens.every((token) => normalizedSearch.includes(token))
      );
    });
  });

  return tokenMatchedClient?.ticker ?? null;
};

const getClientNameForTicker = async (
  ticker: string,
  accessContext: ChatAccessContext,
): Promise<string | null> => {
  const payload = await fetchPortalJson("/clients");
  const root = asRecord(payload);
  const rows = asArray(root?.clients);

  const matchingClient = rows
    .map((row) => asRecord(row))
    .filter((row): row is Record<string, unknown> => Boolean(row))
    .map((row) => ({
      ticker: (asString(row.ticker) ?? "").toUpperCase(),
      aliases: getClientAliases(row),
    }))
    .filter((client) => client.ticker && client.aliases.length > 0)
    .filter((client) => isTickerAllowed(client.ticker, accessContext.allowedTickers))
    .find((client) => client.ticker === ticker.toUpperCase());

  return matchingClient?.aliases[0] ?? null;
};

const deriveTabulationReportSummary = (
  positions: Record<string, unknown>[],
): DerivedTabulationReportSummary => {
  const votedPositions = positions.filter(
    (position) => asString(position.voteStatus ?? position.vote_status) === "Voted",
  );
  const unvotedPositions = positions.filter(
    (position) => asString(position.voteStatus ?? position.vote_status) === "Unvoted",
  );

  const totalShares = positions.reduce((sum, position) => sum + asNumber(position.shares), 0);
  const votedShares = votedPositions.reduce(
    (sum, position) => sum + asNumber(position.sharesVoted ?? position.shares_voted),
    0,
  );

  const dtcVotedShares = votedPositions
    .filter((position) => asString(position.accountType ?? position.account_type) === "DTC/CDS")
    .reduce((sum, position) => sum + asNumber(position.sharesVoted ?? position.shares_voted), 0);

  const dtcUnvotedShares = unvotedPositions
    .filter((position) => asString(position.accountType ?? position.account_type) === "DTC/CDS")
    .reduce((sum, position) => sum + asNumber(position.shares), 0);

  const nonDtcVotedShares = votedPositions
    .filter((position) => asString(position.accountType ?? position.account_type) === "Non-DTC")
    .reduce((sum, position) => sum + asNumber(position.sharesVoted ?? position.shares_voted), 0);

  const nonDtcUnvotedShares = unvotedPositions
    .filter((position) => asString(position.accountType ?? position.account_type) === "Non-DTC")
    .reduce((sum, position) => sum + asNumber(position.shares), 0);

  const setKeys = [
    ...new Set(
      positions
        .map((position) => asString(position.setKey ?? position.set_key))
        .filter((value): value is string => Boolean(value)),
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
  allowedTickers: string[] | null,
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
  accessContext: ChatAccessContext,
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
  accessContext: ChatAccessContext,
): string | null => {
  return requestedMeetingId ?? accessContext.currentMeetingId;
};

const isAllowedNavigationPath = (path: string, allowedTickers: string[] | null): boolean => {
  if (!INTERNAL_PATH_REGEX.test(path)) {
    return false;
  }

  const ticker = extractTickerFromPath(path);
  return isTickerAllowed(ticker, allowedTickers);
};

const buildMeetingRoute = (currentPath: string, nextSegment: string): string | null => {
  const match = /^\/([^/]+)\/((?:past-)?meeting)\/([^/]+)(?:\/.*)?$/.exec(currentPath);

  if (!match) {
    return null;
  }

  const [, clientTicker, meetingScope, meetingId] = match;

  return `/${clientTicker}/${meetingScope}/${meetingId}/${nextSegment}`;
};

const getMessageText = (message: UIMessage): string => {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
};

const getFallbackAssistantReply = (messages: UIMessage[], currentPath: string): string => {
  const latestUserMessage = [...messages].reverse().find((message) => message.role === "user");

  const prompt = latestUserMessage ? getMessageText(latestUserMessage).toLowerCase() : "";

  if (prompt.includes("support") || prompt.includes("contact") || prompt.includes("help desk")) {
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
    keywords.some((keyword) => prompt.includes(keyword)),
  );

  if (matchedPage) {
    const nextSegment = matchedPage.page === "dashboard" ? "dashboard/1" : matchedPage.page;
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

const createFallbackResponse = (messages: UIMessage[], currentPath: string): Response => {
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

const createAssistantTextResponse = (messages: UIMessage[], content: string): Response => {
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
  accessContext,
}: {
  messages: UIMessage[];
  accessContext: ChatAccessContext;
}): Promise<Response | null> => {
  const latestUserMessage = [...messages].reverse().find((message) => message.role === "user");

  if (!latestUserMessage) {
    return null;
  }

  const prompt = getMessageText(latestUserMessage);
  const normalizedPrompt = normalizeText(prompt);

  if (
    !normalizedPrompt.includes("meeting") ||
    (!extractMeetingYearFromSearch(prompt) && !extractMeetingTypeFromSearch(prompt))
  ) {
    return null;
  }

  const inferredTicker = await inferTickerFromSearch(prompt, accessContext);
  const resolvedTicker = resolveClientTicker(inferredTicker ?? undefined, accessContext);
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
            normalizeText(extractMeetingTypeFromSearch(prompt) ?? ""),
          ),
        ) ?? meetings[0]);

  const meetingId = asString(selectedMeeting.id);

  if (!meetingId) {
    return null;
  }

  const meeting = await getMeetingData(meetingId, accessContext.allowedTickers);
  const title = asString(meeting.title) ?? "Meeting";
  const ticker = (asString(meeting.ticker) ?? resolvedTicker).toUpperCase();
  const meetingType = asString(meeting.meetingType) ?? asString(meeting.meeting_type) ?? "Meeting";
  const status = asString(meeting.status) ?? "UNKNOWN";
  const cusip = asString(meeting.cusip) ?? "Unavailable";
  const currentPhase =
    asString(meeting.currentPhase) ?? asString(meeting.current_phase) ?? "Unavailable";
  const meetingDate = asString(meeting.meetingDate) ?? asString(meeting.meeting_date);
  const recordDate = asString(meeting.recordDate) ?? asString(meeting.record_date);
  const mailingDate = asString(meeting.mailingDate) ?? asString(meeting.mailing_date);
  const quorumRequirement = asNumber(meeting.quorumRequirement ?? meeting.quorum_requirement);
  const totalSharesOutstanding = asNumber(
    meeting.totalSharesOutstanding ?? meeting.total_shares_outstanding,
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
  accessContext,
}: {
  messages: UIMessage[];
  accessContext: ChatAccessContext;
}): Promise<Response | null> => {
  const latestUserMessage = [...messages].reverse().find((message) => message.role === "user");

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
    .filter((proposal): proposal is Record<string, unknown> => Boolean(proposal));

  const directorSlate = proposals.filter((proposal) => {
    const directorName = asString(proposal.directorName);
    const proposalType = normalizeText(asString(proposal.proposalType) ?? "");
    const title = normalizeText(asString(proposal.title) ?? "");

    return Boolean(directorName) || proposalType.includes("director") || title.includes("director");
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
    ["The director slate for this meeting is:", ...lines].join("\n"),
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
      const clients = rows
        .map((row) => asRecord(row))
        .filter((row): row is Record<string, unknown> => Boolean(row))
        .map<ClientSummary>((row) => ({
          id: asString(row.id) ?? "",
          ticker: (asString(row.ticker) ?? "").toUpperCase(),
          name:
            asString(row.companyName) ??
            asString(row.company_name) ??
            asString(row.shortName) ??
            asString(row.short_name) ??
            "",
        }))
        .filter((client) => client.id && client.ticker && client.name)
        .filter((client) => isTickerAllowed(client.ticker, accessContext.allowedTickers))
        .filter((client) => {
          if (!normalizedSearch) return true;
          return (
            client.name.toLowerCase().includes(normalizedSearch) ||
            client.ticker.toLowerCase().includes(normalizedSearch)
          );
        });

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
        accessContext,
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

      const resolvedMeetingYear = meetingYear ?? extractMeetingYearFromSearch(search);
      const requestedMeetingType = extractMeetingTypeFromSearch(search);
      const clientName = await getClientNameForTicker(resolvedTicker, accessContext);
      const normalizedMeetingSearch = extractMeetingSearchTerm(
        search,
        clientName,
        resolvedTicker,
        resolvedMeetingYear,
        requestedMeetingType,
      );

      const queryParams = new URLSearchParams({ ticker: resolvedTicker });

      if (typeof resolvedMeetingYear === "number" && Number.isFinite(resolvedMeetingYear)) {
        queryParams.set("meetingYear", String(Math.trunc(resolvedMeetingYear)));
      }

      const payload = await fetchPortalJson(`/meetings?${queryParams.toString()}`);
      const root = asRecord(payload);
      const rows = Array.isArray(root?.meetings) ? root.meetings : [];
      const meetings = rows
        .map((row) => asRecord(row))
        .filter((row): row is Record<string, unknown> => Boolean(row))
        .map<MeetingSummary>((row) => ({
          id: asString(row.id) ?? "",
          ticker: (asString(row.ticker) ?? resolvedTicker).toUpperCase(),
          title: asString(row.title) ?? "",
          status: asString(row.status) ?? "UNKNOWN",
          meetingType: asString(row.meetingType) ?? asString(row.meeting_type) ?? "Meeting",
          meetingYear:
            row.meetingYear !== undefined
              ? asNumber(row.meetingYear)
              : row.meeting_year !== undefined
                ? asNumber(row.meeting_year)
                : null,
          meetingDate: asString(row.meetingDate) ?? asString(row.meeting_date) ?? null,
        }))
        .filter((meeting) => meeting.id && meeting.title)
        .filter((meeting) => {
          if (!requestedMeetingType) return true;
          return normalizeText(meeting.meetingType) === normalizeText(requestedMeetingType);
        })
        .filter((meeting) => {
          if (!normalizedMeetingSearch) return true;
          return (
            normalizeText(meeting.title).includes(normalizedMeetingSearch) ||
            normalizeText(meeting.id).includes(normalizedMeetingSearch) ||
            normalizeText(meeting.status).includes(normalizedMeetingSearch) ||
            normalizeText(meeting.meetingType).includes(normalizedMeetingSearch) ||
            String(meeting.meetingYear ?? "").includes(normalizedMeetingSearch)
          );
        });

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
        return { error: "Provide a meetingId or ask this while viewing a meeting page." };
      }

      const meeting = await getMeetingData(resolvedMeetingId, accessContext.allowedTickers);

      return {
        entity,
        meeting: {
          id: asString(meeting.id) ?? resolvedMeetingId,
          ticker: asString(meeting.ticker) ?? "",
          title: asString(meeting.title) ?? "",
          status: asString(meeting.status) ?? "",
          meetingType: asString(meeting.meetingType) ?? asString(meeting.meeting_type) ?? "",
          meetingDate: asString(meeting.meetingDate) ?? asString(meeting.meeting_date) ?? null,
          recordDate: asString(meeting.recordDate) ?? asString(meeting.record_date) ?? null,
          mailingDate: asString(meeting.mailingDate) ?? asString(meeting.mailing_date) ?? null,
          quorumRequirement: asNumber(meeting.quorumRequirement ?? meeting.quorum_requirement),
          totalSharesOutstanding: asNumber(
            meeting.totalSharesOutstanding ?? meeting.total_shares_outstanding,
          ),
        },
      };
    }

    case "proposals": {
      const resolvedMeetingId = resolveMeetingId(meetingId, accessContext);
      if (!resolvedMeetingId) {
        return { error: "Provide a meetingId or ask this while viewing a meeting page." };
      }

      await getMeetingData(resolvedMeetingId, accessContext.allowedTickers);
      const payload = await fetchPortalJson(`/meetings/${resolvedMeetingId}/proposals`);
      const rows = Array.isArray(payload) ? payload : [];
      const proposals = rows
        .map((row) => asRecord(row))
        .filter((row): row is Record<string, unknown> => Boolean(row))
        .map<ProposalSummary>((row) => ({
          id: asString(row.id) ?? "",
          proposalNumber:
            asString(row.proposalNumber) ??
            asString(row.proposal_number) ??
            asString(row.itemNo) ??
            "",
          title:
            asString(row.title) ??
            asString(row.proposalTitle) ??
            asString(row.proposal_title) ??
            asString(row.directorName) ??
            asString(row.director_name) ??
            "",
          directorName: asString(row.directorName) ?? asString(row.director_name) ?? null,
          proposalType: asString(row.proposalType) ?? asString(row.proposal_type) ?? null,
          managementRecommendation:
            asString(row.managementRecommendation) ??
            asString(row.management_recommendation) ??
            asString(row.recommendation) ??
            "",
          finalResult: asString(row.finalResult) ?? asString(row.final_result) ?? "",
        }))
        .filter((proposal) => proposal.id || proposal.title)
        .filter((proposal) => {
          if (!normalizedSearch) return true;
          return (
            proposal.title.toLowerCase().includes(normalizedSearch) ||
            proposal.proposalNumber.toLowerCase().includes(normalizedSearch) ||
            proposal.finalResult.toLowerCase().includes(normalizedSearch) ||
            (proposal.directorName?.toLowerCase().includes(normalizedSearch) ?? false) ||
            (proposal.proposalType?.toLowerCase().includes(normalizedSearch) ?? false)
          );
        });

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
        return { error: "Provide a meetingId or ask this while viewing a meeting page." };
      }

      await getMeetingData(resolvedMeetingId, accessContext.allowedTickers);
      const payload = await fetchPortalJson(`/meetings/${resolvedMeetingId}/tasks`);
      const rows = Array.isArray(payload) ? payload : [];
      const tasks = rows
        .map((row) => asRecord(row))
        .filter((row): row is Record<string, unknown> => Boolean(row))
        .map<TaskSummary>((row) => ({
          taskId: asString(row.taskId) ?? asString(row.task_id) ?? asString(row.id) ?? "",
          title: asString(row.title) ?? "",
          status: asString(row.status) ?? "",
          dueDate: asString(row.dueDate) ?? asString(row.due_date) ?? null,
          owner: asString(row.owner) ?? "",
          phaseNumber:
            row.phaseNumber !== undefined
              ? asNumber(row.phaseNumber)
              : row.phase_number !== undefined
                ? asNumber(row.phase_number)
                : null,
        }))
        .filter((task) => task.taskId || task.title)
        .filter((task) => {
          if (!normalizedSearch) return true;
          return (
            task.title.toLowerCase().includes(normalizedSearch) ||
            task.status.toLowerCase().includes(normalizedSearch) ||
            task.owner.toLowerCase().includes(normalizedSearch)
          );
        });

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
        return { error: "Provide a meetingId or ask this while viewing a meeting page." };
      }

      await getMeetingData(resolvedMeetingId, accessContext.allowedTickers);
      const payload = await fetchPortalJson(
        `/positions?meetingId=${resolvedMeetingId}&limit=50000`,
      );
      const root = asRecord(payload);
      const rows = Array.isArray(payload) ? payload : asArray(root?.positions);
      const positions = rows
        .map((row) => asRecord(row))
        .filter((row): row is Record<string, unknown> => Boolean(row))
        .map<PositionSummary>((row) => ({
          name: asString(row.name) ?? "",
          accountType: asString(row.accountType) ?? asString(row.account_type) ?? "",
          voteStatus: asString(row.voteStatus) ?? asString(row.vote_status) ?? "",
          shares: asNumber(row.shares),
          sharesVoted: asNumber(row.sharesVoted ?? row.shares_voted),
          source: asString(row.source) ?? "",
          controlNumber: asString(row.controlNumber) ?? asString(row.control_number) ?? "",
        }))
        .filter((position) => position.name)
        .filter((position) => {
          if (!normalizedSearch) return true;
          return (
            position.name.toLowerCase().includes(normalizedSearch) ||
            position.accountType.toLowerCase().includes(normalizedSearch) ||
            position.voteStatus.toLowerCase().includes(normalizedSearch) ||
            position.controlNumber.toLowerCase().includes(normalizedSearch)
          );
        });

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
        return { error: "Provide a meetingId or ask this while viewing a meeting page." };
      }

      await getMeetingData(resolvedMeetingId, accessContext.allowedTickers);
      try {
        const payload = await fetchPortalJson(`/meetings/${resolvedMeetingId}/tabulation-report`);
        const report = asRecord(payload);
        if (!report) {
          throw new Error(`Tabulation report for ${resolvedMeetingId} is unavailable.`);
        }

        return {
          entity,
          meetingId: resolvedMeetingId,
          source: "tabulation-report",
          voteDistribution: asRecord(report.voteDistribution),
          positionsVoted: asRecord(report.positionsVoted),
          setKeys: asStringArray(report.setKeys),
        };
      } catch (_error) {
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

    const currentPath = getCurrentPath(request);
    const accessContext = await getChatAccessContext(currentPath);
    const model = buildChatModel();

    const deterministicMeetingResponse = await tryHandleMeetingOverviewPrompt({
      messages,
      accessContext,
    });

    if (deterministicMeetingResponse) {
      return deterministicMeetingResponse;
    }

    const deterministicDirectorSlateResponse = await tryHandleDirectorSlatePrompt({
      messages,
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
          page: z.enum(["dashboard", "agenda", "mailing", "tabulation", "reports"]),
        }),
        execute: ({ page }: { page: MeetingPage }) => {
          const nextSegment = page === "dashboard" ? "dashboard/1" : page;
          const path = buildMeetingRoute(currentPath, nextSegment);

          if (!path) {
            return {
              error: "The user is not currently on a meeting route that can be navigated from.",
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
              error: error instanceof Error ? error.message : "The portal data query failed.",
            };
          }
        },
      },
    };

    const result = streamText({
      model,
      stopWhen: stepCountIs(4),
      messages: await convertToModelMessages(messages),
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
    return new Response("The assistant is unavailable right now.", { status: 500 });
  }
}
