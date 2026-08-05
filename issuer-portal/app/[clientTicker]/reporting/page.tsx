"use client";

import {
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  Container,
  Skeleton,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { useParams } from "next/navigation";
import {
  type ComponentProps,
  type ReactElement,
  Suspense,
  useState,
} from "react";

import BrokerVotingChart from "@/components/Reporting/BrokerVotingChart";
import EventSummaryTable from "@/components/Reporting/EventSummaryTable";
import { GeoHeatmapCard } from "@/components/Reporting/GeoHeatmapCard";
import ParticipationChart from "@/components/Reporting/ParticipationChart";
import PositionsVotedChart from "@/components/Reporting/PositionsVotedChart";
import ProposalPerformanceTable from "@/components/Reporting/ProposalPerformanceTable";
import { QuorumTimelineChart } from "@/components/Reporting/QuorumTimelineChart/QuorumTimelineChart";
import { useQuorumTimeline } from "@/components/Reporting/QuorumTimelineChart/useQuorumTimeline";
import VotingPerformanceChart from "@/components/Reporting/VotingPerformanceChart";
import YearOverYearChart from "@/components/Reporting/YearOverYearChart";
import { useClientFeatures } from "@/hooks/useClientFeatures";
import { useReporting } from "@/hooks/useReporting";
import { useReports } from "@/hooks/useReports";
import {
  classifyMailingDistribution,
  computeRecommendedMailByDate,
  mailingDistributionShortLabel,
  parseLocalDate,
} from "@/utils/dateUtils";
import { asParamString } from "@/utils/typeUtils";

const ChartSkeleton = () => (
  <Skeleton
    variant="rectangular"
    width="100%"
    height={400}
    sx={{ borderRadius: 2 }}
  />
);

/** Voted/not-voted position counts split into registered vs beneficial holders, keyed per set. */
interface PositionsVotedBuckets {
  registered: { voted: number; notVoted: number };
  beneficial: { voted: number; notVoted: number };
}

interface ReportingAnalyticsSectionProps {
  readonly effectiveMeetingId: string;
  readonly brokerChartProposals: ComponentProps<
    typeof BrokerVotingChart
  >["proposals"];
  readonly brokerVotingByProposal: ComponentProps<
    typeof BrokerVotingChart
  >["brokerData"];
  readonly loading: boolean;
  readonly reportsLoading: boolean;
  readonly selectedMeetingLabel: string;
  readonly positionsVotedSetKeys: string[];
  readonly positionsVotedBySet: ComponentProps<
    typeof PositionsVotedChart
  >["data"];
  readonly participationChartData: ComponentProps<
    typeof ParticipationChart
  >["data"];
  readonly mappedProposalPerformanceData: ComponentProps<
    typeof ProposalPerformanceTable
  >["data"];
}

// Per-event Analytics section (gated behind the `nobo` client feature). Extracted
// from ReportingPage to keep the page component focused; all data is derived in
// the parent and threaded in via explicit props.
const ReportingAnalyticsSection = ({
  effectiveMeetingId,
  brokerChartProposals,
  brokerVotingByProposal,
  loading,
  reportsLoading,
  selectedMeetingLabel,
  positionsVotedSetKeys,
  positionsVotedBySet,
  participationChartData,
  mappedProposalPerformanceData,
}: ReportingAnalyticsSectionProps): ReactElement => (
  <>
    <Grid size={12}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          mt: 1,
        }}
      >
        <Typography variant="pageTitle" component="h2">
          Analytics
        </Typography>
      </Box>
    </Grid>

    <Grid size={{ xs: 12, lg: 6 }}>
      <BrokerVotingChart
        meetingId={effectiveMeetingId || undefined}
        proposals={brokerChartProposals}
        brokerData={brokerVotingByProposal}
        loading={loading || reportsLoading}
        subheader={selectedMeetingLabel}
      />
    </Grid>

    <Grid size={{ xs: 12, lg: 6 }}>
      {effectiveMeetingId ? (
        <VotingPerformanceChart
          meetingId={effectiveMeetingId}
          subheader={selectedMeetingLabel}
        />
      ) : (
        <ChartSkeleton />
      )}
    </Grid>

    <Grid size={{ xs: 12, lg: 6 }}>
      <GeoHeatmapCard
        meetingId={effectiveMeetingId || undefined}
        subheader={selectedMeetingLabel || undefined}
      />
    </Grid>

    <Grid size={{ xs: 12, lg: 6 }}>
      <PositionsVotedChart
        meetingId={effectiveMeetingId || undefined}
        setKeys={positionsVotedSetKeys}
        data={positionsVotedBySet}
        subheader={selectedMeetingLabel}
      />
    </Grid>

    <Grid size={{ xs: 12, lg: 6 }}>
      <Card sx={{ height: "100%" }}>
        <CardHeader
          title="Participation by Year"
          subheader="Average participation rate across completed events"
        />
        <CardContent>
          <ParticipationChart data={participationChartData} loading={loading} />
        </CardContent>
      </Card>
    </Grid>

    <Grid size={12}>
      <Suspense fallback={<ChartSkeleton />}>
        <ProposalPerformanceTable data={mappedProposalPerformanceData} />
      </Suspense>
    </Grid>
  </>
);

/**
 * Client-level reporting page. The historical summary tables (event summary,
 * year-over-year, quorum performance) are followed by a per-event Analytics
 * section added in 002-tabulation-enhancements: quorum timeline, broker
 * voting, voting performance, positions voted, participation by year, and
 * the geographic heat map.
 *
 * An event selector scopes the Analytics charts; it defaults to the first
 * available meeting until the user picks one. The quorum timeline derives its
 * milestones from the meeting and threads the selected meeting's quorum
 * requirement into the threshold line.
 */
const ReportingPage = () => {
  const params = useParams();
  const clientTicker = asParamString(params.clientTicker);

  const { data: reportingData, loading, error } = useReporting(clientTicker);
  const { isEnabled } = useClientFeatures();
  const hasNoboFeature = isEnabled("nobo");
  const [selectedMeetingId, setSelectedMeetingId] = useState("");

  const mappedEventSummary = reportingData?.mappedEventSummary ?? [];
  const mappedYearOverYear = reportingData?.mappedYearOverYear ?? [];
  const mappedProposalPerformanceData =
    reportingData?.mappedProposalPerformanceData ?? [];
  // No useMemo below: the React Compiler already caches these.
  const availableMeetings = reportingData?.availableMeetings ?? [];
  const positions = reportingData?.positions ?? [];
  const proposals = reportingData?.proposals ?? [];

  const effectiveMeetingId =
    selectedMeetingId !== ""
      ? selectedMeetingId
      : (availableMeetings[0]?.id ?? "");
  const selectedMeeting =
    reportingData?.meetings.find((m) => m.id === effectiveMeetingId) ?? null;

  // Mirrors the event selector's option label so each analytics card can show
  // which meeting it is scoped to in its subheader.
  const selectedMeetingEntry = availableMeetings.find(
    (m) => m.id === effectiveMeetingId
  );
  const selectedMeetingLabel =
    selectedMeetingEntry === undefined
      ? ""
      : selectedMeetingEntry.year !== null
        ? `${selectedMeetingEntry.title} - ${selectedMeetingEntry.year}`
        : selectedMeetingEntry.title;

  const { brokerVotingByProposal, loading: reportsLoading } = useReports(
    effectiveMeetingId === "" ? undefined : effectiveMeetingId
  );

  const brokerChartProposals = proposals
    .flatMap((proposal) =>
      proposal.meetingId === effectiveMeetingId
        ? [
            {
              id: proposal.id ?? "",
              proposalNumber: String(proposal.proposalNumber ?? ""),
              proposalTitle: proposal.proposalTitle ?? "",
            },
          ]
        : []
    )
    .sort((a, b) => Number(a.proposalNumber) - Number(b.proposalNumber));

  const positionsVotedBySet: Record<string, PositionsVotedBuckets> = {};
  for (const position of positions) {
    if (position.meetingId !== effectiveMeetingId) continue;

    const key =
      position.setKey !== null &&
      position.setKey !== undefined &&
      position.setKey !== ""
        ? position.setKey
        : "All Positions";
    if (!(key in positionsVotedBySet)) {
      positionsVotedBySet[key] = {
        registered: { voted: 0, notVoted: 0 },
        beneficial: { voted: 0, notVoted: 0 },
      };
    }

    const bucket =
      position.accountType === "Non-DTC"
        ? positionsVotedBySet[key].registered
        : positionsVotedBySet[key].beneficial;

    if (position.voteStatus === "Voted") {
      bucket.voted += 1;
    } else {
      bucket.notVoted += 1;
    }
  }

  const positionsVotedSetKeys = Object.keys(positionsVotedBySet);

  const quorumData = reportingData?.quorumData ?? [];
  const eventSummaryForParticipation = reportingData?.mappedEventSummary ?? [];
  const participationChartData = {
    meetings: quorumData.flatMap((quorum) => {
      const summary = eventSummaryForParticipation.find(
        (event) => event.meetingId === quorum.meetingId
      );
      const meetingYear = summary?.meetingYear ?? 0;
      if (meetingYear <= 0) return [];
      return [
        {
          event: quorum.meetingTitle,
          participationRate: quorum.participationRate,
          meetingYear,
        },
      ];
    }),
  };

  const quorumMeetingDate =
    selectedMeeting?.meetingDate !== undefined &&
    selectedMeeting.meetingDate !== ""
      ? parseLocalDate(selectedMeeting.meetingDate)
      : null;
  const quorumDistribution = classifyMailingDistribution(
    selectedMeeting?.distributionType
  );
  const quorumMailDate =
    quorumMeetingDate !== null && quorumDistribution !== null
      ? computeRecommendedMailByDate(quorumMeetingDate, quorumDistribution).date
      : (selectedMeeting?.mailingDate ?? null);
  const quorumEndDate =
    quorumMeetingDate ?? selectedMeeting?.cutoffDate ?? null;
  const quorumMilestones = [];

  if (quorumMailDate !== null) {
    quorumMilestones.push({
      date: quorumMailDate,
      kind: "mail" as const,
      label:
        quorumDistribution === null
          ? "Mail Date"
          : `Mail Date · ${mailingDistributionShortLabel(quorumDistribution)}`,
    });
  }

  if (quorumEndDate !== null) {
    quorumMilestones.push({
      date: quorumEndDate,
      kind: "deadline" as const,
      label: "Meeting Date",
    });
  }

  const quorumTimelineInput = {
    endDate: quorumEndDate,
    milestones: quorumMilestones,
    startDate: quorumMailDate,
    totalOutstandingShares: Number(
      selectedMeeting?.totalSharesOutstanding ?? 0
    ),
    votes: positions.flatMap((position) =>
      position.meetingId === effectiveMeetingId &&
      position.voteStatus === "Voted" &&
      Boolean(position.dateVoted)
        ? [
            {
              date: parseLocalDate((position.dateVoted ?? "").slice(0, 10)),
              shares: Number(position.sharesVoted ?? 0),
            },
          ]
        : []
    ),
  };

  const { points: quorumTimelinePoints, milestones: quorumTimelineMilestones } =
    useQuorumTimeline(quorumTimelineInput);

  if (error !== null) {
    return (
      <Container component="main" maxWidth="xl" sx={{ p: 3 }}>
        <Alert severity="error">{String(error)}</Alert>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="xl" sx={{ p: { xs: 1, md: 3 } }}>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Suspense fallback={<ChartSkeleton />}>
            <EventSummaryTable
              data={mappedEventSummary}
              clientTicker={clientTicker}
              loading={loading}
            />
          </Suspense>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Suspense fallback={<ChartSkeleton />}>
            <Card>
              <CardHeader
                title="Year Over Year Registered vs Beneficial Performance"
                subheader="Participation broken down by registered vs beneficial YOY by shares"
              />
              <CardContent>
                <YearOverYearChart
                  data={mappedYearOverYear}
                  loading={loading}
                />
              </CardContent>
            </Card>
          </Suspense>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <QuorumTimelineChart
            points={quorumTimelinePoints}
            milestones={quorumTimelineMilestones}
            quorumRequirementPercent={
              selectedMeeting?.quorumRequirement ?? null
            }
            loading={loading}
            events={availableMeetings.map((meeting) => ({
              id: meeting.id,
              label:
                meeting.year !== null
                  ? `${meeting.title} - ${meeting.year}`
                  : meeting.title,
            }))}
            selectedEventId={effectiveMeetingId}
            onEventChange={setSelectedMeetingId}
            subheader={
              selectedMeetingLabel === "" ? undefined : selectedMeetingLabel
            }
          />
        </Grid>
        {hasNoboFeature === true ? (
          <ReportingAnalyticsSection
            effectiveMeetingId={effectiveMeetingId}
            brokerChartProposals={brokerChartProposals}
            brokerVotingByProposal={brokerVotingByProposal}
            loading={loading}
            reportsLoading={reportsLoading}
            selectedMeetingLabel={selectedMeetingLabel}
            positionsVotedSetKeys={positionsVotedSetKeys}
            positionsVotedBySet={positionsVotedBySet}
            participationChartData={participationChartData}
            mappedProposalPerformanceData={mappedProposalPerformanceData}
          />
        ) : null}
      </Grid>
    </Container>
  );
};

export default ReportingPage;
