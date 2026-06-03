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
