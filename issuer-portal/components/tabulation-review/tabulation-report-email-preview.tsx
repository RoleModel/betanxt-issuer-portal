"use client";

import { Box, Button, Card, CardContent, Chip, Divider, Stack, Typography } from "@mui/material";

import type {
  TabulationEmailPreviewData,
  TabulationEmailPreviewProposal,
} from "@/hooks/use-tabulation-report-email-preview";

interface TabulationReportEmailPreviewProps {
  readonly preview: TabulationEmailPreviewData | null;
}

const emailColors = {
  abstain: "#D97706",
  against: "#DC2626",
  border: "#D1D5DB",
  for: "#447A44",
  muted: "#6B7280",
  navy: "#071D49",
  text: "#111827",
  textLight: "#374151",
  warning: "#92400E",
  white: "#FFFFFF",
};

const formatDate = (date: string): string =>
  new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    weekday: "long",
    year: "numeric",
  });

const formatNumber = (value: number): string => value.toLocaleString("en-US");

interface EmailProgressBarProps {
  readonly color: string;
  readonly percent: number;
}

const EmailProgressBar = ({ color, percent }: EmailProgressBarProps) => (
  <Box
    sx={{
      backgroundColor: "#E5E7EB",
      borderRadius: 3,
      height: 6,
      overflow: "hidden",
      width: "100%",
    }}
  >
    <Box
      sx={{
        backgroundColor: color,
        borderRadius: 3,
        height: "100%",
        width: `${Math.min(100, Math.max(0, percent))}%`,
      }}
    />
  </Box>
);

interface ProposalEmailRowProps {
  readonly proposal: TabulationEmailPreviewProposal;
}

const ProposalEmailRow = ({ proposal }: ProposalEmailRowProps) => (
  <Box sx={{ borderBottom: `1px solid ${emailColors.border}`, px: 3, py: 2 }}>
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            color: emailColors.muted,
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          Proposal {proposal.number}
        </Typography>
        <Typography sx={{ color: emailColors.text, fontSize: 14, fontWeight: 700 }}>
          {proposal.title}
        </Typography>
      </Box>
      <Typography sx={{ color: emailColors.muted, flexShrink: 0, fontSize: 12 }}>
        {proposal.votedPercent}% voted
      </Typography>
    </Stack>
    <Box
      sx={{
        display: "grid",
        gap: 1.25,
        gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(4, minmax(0, 1fr))" },
        mt: 1.5,
      }}
    >
      <VoteMetric
        color={emailColors.for}
        label="For"
        percent={proposal.forPercent}
        value={proposal.votesFor}
      />
      <VoteMetric
        color={emailColors.against}
        label="Against"
        percent={proposal.againstPercent}
        value={proposal.votesAgainst}
      />
      <VoteMetric
        color={emailColors.abstain}
        label="Abstain"
        percent={proposal.abstainPercent}
        value={proposal.votesAbstain}
      />
      <VoteMetric
        color={emailColors.muted}
        label="Not cast"
        percent={Math.max(0, 100 - proposal.votedPercent)}
        value={proposal.votesNotCast}
      />
    </Box>
  </Box>
);

interface VoteMetricProps {
  readonly color: string;
  readonly label: string;
  readonly percent: number;
  readonly value: number;
}

const VoteMetric = ({ color, label, percent, value }: VoteMetricProps) => (
  <Box sx={{ flex: 1, minWidth: 0 }}>
    <Typography sx={{ color, fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>
      {label} {percent}%
    </Typography>
    <EmailProgressBar color={color} percent={percent} />
    <Typography sx={{ color: emailColors.muted, fontSize: 10, mt: 0.25 }}>
      {formatNumber(value)}
    </Typography>
  </Box>
);

/** Read-only preview of the client-facing daily tabulation report email. */
export const TabulationReportEmailPreview = ({ preview }: TabulationReportEmailPreviewProps) => {
  if (preview === null) {
    return null;
  }

  const urgencyLabel =
    preview.daysUntilMeeting <= 3
      ? "Meeting in 3 days or less - final push required"
      : preview.daysUntilMeeting <= 7
        ? `${preview.daysUntilMeeting} days remaining - increase solicitation efforts`
        : `${preview.daysUntilMeeting} days until meeting`;
  const urgencyColor =
    preview.daysUntilMeeting <= 3
      ? emailColors.against
      : preview.daysUntilMeeting <= 7
        ? emailColors.warning
        : "#1E40AF";
  const quorumColor = preview.quorumMet
    ? emailColors.for
    : preview.quorumPercent >= preview.quorumRequired - 10
      ? emailColors.abstain
      : emailColors.against;

  return (
    <Card sx={{ alignSelf: "start", overflow: "hidden" }}>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ bgcolor: emailColors.navy, color: emailColors.white, px: 3, py: 2 }}>
          <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography sx={{ fontSize: 15, fontWeight: 800 }}>{preview.companyName}</Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.76)", fontSize: 12 }}>
                {preview.meetingType} - Daily Tabulation Report
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 12, fontWeight: 800 }}>BetaNXT</Typography>
          </Stack>
        </Box>

        <Box
          sx={{
            bgcolor: "#EFF6FF",
            borderBottom: `1px solid ${emailColors.border}`,
            px: 3,
            py: 1.25,
          }}
        >
          <Typography sx={{ color: urgencyColor, fontSize: 12, fontWeight: 700 }}>
            {urgencyLabel} - Meeting date: {formatDate(preview.meetingDate)}
          </Typography>
        </Box>

        <Box sx={{ px: 3, py: 2.5 }}>
          <Typography sx={{ color: emailColors.text, fontSize: 14 }}>
            Hello {preview.recipientName},
          </Typography>
          <Typography sx={{ color: emailColors.textLight, fontSize: 14, lineHeight: 1.6, mt: 1 }}>
            Here is your automated daily vote tabulation summary for {preview.companyName}, as of{" "}
            {formatDate(preview.reportDate)}.
          </Typography>
        </Box>

        <Box sx={{ px: 3, pb: 2.5 }}>
          <Box
            sx={{
              bgcolor: preview.quorumMet ? "#F0FAF0" : "#FFF5F5",
              border: `1px solid ${preview.quorumMet ? emailColors.for : "#FEE2E2"}`,
              borderRadius: 1,
              p: 2,
            }}
          >
            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    color: emailColors.muted,
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                  }}
                >
                  Quorum Status
                </Typography>
                <Typography sx={{ color: quorumColor, fontSize: 24, fontWeight: 800 }}>
                  {preview.quorumPercent}%{" "}
                  <Box
                    component="span"
                    sx={{ color: emailColors.muted, fontSize: 13, fontWeight: 400 }}
                  >
                    of eligible shares voted
                  </Box>
                </Typography>
                <EmailProgressBar color={quorumColor} percent={preview.quorumPercent} />
                <Typography sx={{ color: emailColors.muted, fontSize: 11, mt: 0.5 }}>
                  {formatNumber(preview.totalSharesVoted)} of{" "}
                  {formatNumber(preview.totalSharesEligible)} shares - {preview.quorumRequired}%
                  threshold required
                </Typography>
              </Box>
              <Chip
                color={preview.quorumMet ? "success" : "error"}
                label={preview.quorumMet ? "Quorum Met" : "Below Quorum"}
                size="small"
              />
            </Stack>
          </Box>
        </Box>

        <Box sx={{ bgcolor: "#F3F4F6", borderY: `1px solid ${emailColors.border}`, px: 3, py: 1 }}>
          <Typography
            sx={{
              color: emailColors.muted,
              fontSize: 11,
              fontWeight: 800,
              textTransform: "uppercase",
            }}
          >
            Vote Breakdown by Proposal ({preview.proposals.length} total)
          </Typography>
        </Box>

        {preview.proposals.map((proposal) => (
          <ProposalEmailRow key={`${proposal.number}-${proposal.title}`} proposal={proposal} />
        ))}

        <Box sx={{ px: 3, py: 2.5, textAlign: "center" }}>
          <Typography sx={{ color: emailColors.textLight, fontSize: 13, mb: 2 }}>
            View full tabulation details, position-level breakdowns, and manage distribution
            settings in the portal.
          </Typography>
          <Button href={preview.portalUrl} size="small" variant="contained">
            View Full Tabulation Report
          </Button>
        </Box>

        <Divider />
        <Box sx={{ bgcolor: "#F9FAFB", px: 3, py: 1.5 }}>
          <Typography sx={{ color: emailColors.muted, fontSize: 11, textAlign: "center" }}>
            This is an automated daily report. Distribution begins 15 days before the meeting date.
            To manage recipients or pause delivery, visit your tabulation settings.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
