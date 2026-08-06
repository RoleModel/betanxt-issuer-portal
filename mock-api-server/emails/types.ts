export interface DocumentUpdateNotificationProps {
  meetingType: string;
  issuerAccountName: string;
  documentName: string;
  uploaderName: string;
  uploaderAvatarUrl?: string;
  documentDescription: string;
  uploadDate: string | Date;
  viewDocumentUrl: string;
  portalBaseUrl: string;
}

export interface TabulationReportProposal {
  number: string;
  title: string;
  totalShares: number;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  votesNotCast: number;
}

export interface MailingElectronicNoticeProps {
  /** Short company name, e.g. "Woodward". Used in the header and body copy. */
  companyName: string;
  /** Legal entity name, e.g. "Woodward, Inc.". */
  companyLegalName: string;
  /**
   * The client's primary brand colour (hex). The company name and rules adopt
   * it so the notice matches the client's theme. Falls back to the BetaNXT navy.
   */
  brandColor?: string;
  /** Meeting date and time line, e.g. "January 28, 2026 at 8:00 a.m. CT". */
  meetingDateTime: string;
  /** Plan record date line, e.g. "December 1, 2025". */
  recordDate: string;
  /** Voting deadline line, e.g. "8:00 a.m. CT on Tuesday, January 27, 2026". */
  votingDeadline: string;
  /** Proxy-push URL shown top-right, e.g. "https://www.proxypush.com/WWD". */
  proxyPushUrl: string;
  /** Display label for the proxy-push URL, e.g. "www.proxypush.com/WWD". */
  proxyPushLabel: string;
  /** Secure voting site, e.g. "https://www.proxydocs.com/WWD". */
  voteSiteUrl: string;
  /** Personalised voting control number. */
  controlNumber: string;
  /** Telephone voting number. */
  phone: string;
  /** Contact for requesting printed copies. */
  printedCopiesContactName: string;
  printedCopiesContactEmail: string;
  /** Contact for voting-process questions. */
  questionsContactName: string;
  questionsContactLocation: string;
  questionsContactEmail: string;
  portalBaseUrl: string;
}

export interface TabulationReportEmailProps {
  companyName: string;
  meetingType: string;
  meetingDate: string;
  reportDate: string;
  daysUntilMeeting: number;
  recipientName: string;
  proposals: TabulationReportProposal[];
  totalSharesEligible: number;
  totalSharesVoted: number;
  quorumRequired: number;
  quorumMet: boolean;
  viewTabulationUrl: string;
  portalBaseUrl: string;
}
