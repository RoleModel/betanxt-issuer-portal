/**
 * Parse a date string as local midnight, avoiding the UTC-offset shift that
 * `new Date("YYYY-MM-DD")` introduces (ISO-only strings are parsed as UTC,
 * which shifts the displayed day backward in negative-offset timezones).
 */
export function parseLocalDate(dateString: string): Date {
  // Pure ISO date "YYYY-MM-DD" — build from parts to get local midnight
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  // Full ISO timestamps already carry timezone info — let the runtime handle them
  return new Date(dateString);
}

/**
 * Calculate the number of days until a given date
 * @param dateString - The target date string
 * @returns Number of days until the date (negative if past)
 */
export const calculateDaysUntil = (dateString: string): number => {
  const targetDate = parseLocalDate(dateString);
  const today = new Date();

  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Format a date string for display
 * @param dateString - The date string to format
 * @returns Formatted date string
 */
export const formatDateForDisplay = (dateString: string): string => {
  const date = parseLocalDate(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * Format a date string for display
 * @param dateString - The date string to format
 * @returns Formatted date string
 */
export const friendlyDate = (dateString: string): string => {
  const date = parseLocalDate(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

/**
 * Check if a date is in the past
 * @param dateString - The date string to check
 * @returns True if the date is in the past
 */
export const isDateInPast = (dateString: string): boolean =>
  calculateDaysUntil(dateString) < 0;

/**
 * Format days until a date for display
 * @param days - Number of days until the date (negative if past)
 * @returns Formatted string describing the time until/since the date
 */
export const formatDaysUntil = (days: number): string => {
  if (days === 0) {
    return "Today";
  }
  if (days === 1) {
    return "Tomorrow";
  }
  if (days === -1) {
    return "Yesterday";
  }
  if (days > 0) {
    return `${days} Days`;
  }
  return `${Math.abs(days)} days ago`;
};

/** Proxy material distribution method, used to derive the required/recommended mail-by date. */
export type MailingDistributionType =
  "noticeAndAccess" | "fullSet" | "combination";

/** Notice & Access materials must be distributed at least 40 calendar days before the meeting. */
export const NOTICE_AND_ACCESS_LEAD_DAYS = 40;

/** Full Set distributions are recommended at least 15 calendar days before the meeting. */
export const FULL_SET_LEAD_DAYS = 15;

/**
 * Classify a meeting's free-text `distributionType` into a known mailing method.
 *
 * A meeting can mail both Notice & Access and Full Set materials at once; when
 * the value indicates both (or "combination"/"both"), it is treated as a
 * combination, which is governed by the stricter Notice & Access 40-day rule.
 *
 * @param distributionType - The meeting's distribution type (e.g. "Notice & Access", "Full Set", "NAA/FS")
 * @returns The matched mailing method, or null when the value is empty or unrecognized
 */
export function classifyMailingDistribution(
  distributionType: string | null | undefined
): MailingDistributionType | null {
  const normalized = (distributionType ?? "").trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const hasNoticeAndAccess =
    normalized.includes("notice") ||
    normalized.includes("access") ||
    normalized.includes("naa") ||
    normalized.includes("n&a") ||
    normalized.includes("n/a");
  const hasFullSet =
    normalized.includes("full") ||
    normalized.includes("fs") ||
    normalized.includes("fullset");

  if (normalized.includes("combination") || normalized.includes("both")) {
    return "combination";
  }
  if (hasNoticeAndAccess && hasFullSet) {
    return "combination";
  }
  if (hasNoticeAndAccess) {
    return "noticeAndAccess";
  }
  if (hasFullSet) {
    return "fullSet";
  }
  return null;
}

/** Short marker label for a mailing distribution, including its mail-by lead time. */
export function mailingDistributionShortLabel(
  distribution: MailingDistributionType
): string {
  switch (distribution) {
    case "fullSet": {
      return `FS (+${FULL_SET_LEAD_DAYS} days)`;
    }
    case "combination": {
      return `NAA/FS (+${NOTICE_AND_ACCESS_LEAD_DAYS} days)`;
    }
    case "noticeAndAccess":
    default: {
      return `NAA (+${NOTICE_AND_ACCESS_LEAD_DAYS} days)`;
    }
  }
}

/** Whether a date lands on a Saturday or Sunday. */
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/** The required/recommended mail-by date for a meeting, plus context for labeling. */
export interface RecommendedMailByResult {
  /** Local-midnight date by which materials should be mailed. */
  date: Date;
  distribution: MailingDistributionType;
  /** True when the 40-day Notice & Access requirement applies (N&A or combination). */
  required: boolean;
  /** Calendar days before the meeting date after any weekend adjustment. */
  leadDays: number;
}

/**
 * Compute the latest date by which proxy materials should be mailed for a meeting.
 *
 * Notice & Access materials must be distributed at least 40 calendar days before
 * the meeting; if that day falls on a weekend it is moved earlier to the last
 * business day that still satisfies the 40-day minimum (41 or 42 days out). Full
 * Set distributions are not subject to the 40-day rule but are recommended at
 * least 15 calendar days before the meeting. Combination mailings (both N&A and
 * Full Set) are governed by the stricter 40-day Notice & Access rule.
 *
 * @param meetingDate - The meeting date (used as the anchor for the countback)
 * @param distribution - The mailing method (see {@link classifyMailingDistribution})
 * @returns The mail-by date with its lead-day count and whether it is required
 */
export function computeRecommendedMailByDate(
  meetingDate: Date,
  distribution: MailingDistributionType
): RecommendedMailByResult {
  const isGovernedByNoticeAndAccess =
    distribution === "noticeAndAccess" || distribution === "combination";
  const leadDays = isGovernedByNoticeAndAccess
    ? NOTICE_AND_ACCESS_LEAD_DAYS
    : FULL_SET_LEAD_DAYS;

  const date = new Date(
    meetingDate.getFullYear(),
    meetingDate.getMonth(),
    meetingDate.getDate() - leadDays
  );

  let effectiveLeadDays = leadDays;
  // Notice & Access (and combination) mailings cannot land on a weekend; step
  // back to the prior business day, which only increases the lead time and keeps
  // the 40-day floor.
  if (isGovernedByNoticeAndAccess) {
    while (isWeekend(date)) {
      date.setDate(date.getDate() - 1);
      effectiveLeadDays += 1;
    }
  }

  return {
    date,
    distribution,
    required: isGovernedByNoticeAndAccess,
    leadDays: effectiveLeadDays,
  };
}
