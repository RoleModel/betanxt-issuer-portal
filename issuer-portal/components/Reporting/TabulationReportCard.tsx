'use client'

import { IconForFileType } from '@rolemodel/betanxt-design-system/components/icons/IconForFileType'

import { useClient } from '@/contexts/ClientContext'
import { useMeeting } from '@/contexts/MeetingContext'
import { useVotingTabulation } from '@/hooks/useVotingTabulation'
import { exportTabulationPdf } from '@/utils/exportTabulationPdf'

import FeatureTile from '../FeatureTile'

export default function TabulationReportCard() {
  const { currentClient } = useClient()
  const { currentMeeting } = useMeeting()
  const { proposals, votingSummary } = useVotingTabulation(currentMeeting?.id)

  const handleDownload = async () => {
    if (!currentMeeting || !proposals) return

    try {
      await exportTabulationPdf({
        tabulationData: {
          companyName: currentClient?.company_name ?? currentClient?.short_name ?? 'Company',
          meetingType: currentMeeting.meetingType ?? 'Annual Meeting',
          meetingDate: currentMeeting.meetingDate ?? '',
          recordDate: currentMeeting.recordDate ?? '',
          totalOutstanding: votingSummary?.totalSharesOutstanding ?? 0,
          votesRepresentedForQuorum: votingSummary?.totalSharesVoted ?? 0,
          quorumPercentage: votingSummary?.percentageVoted ?? 0,
          quorumRequirement: '50%',
          votesOverUnderQuorum:
            (votingSummary?.totalSharesVoted ?? 0) -
            (votingSummary?.totalSharesOutstanding ?? 0) * 0.5,
          cusipList: currentMeeting.cusip ?? '',
          brokerNonVote: currentMeeting.brokerNonVote ?? 0,
          proposals: proposals.map((p) => ({
            proposalNumber: String(p.proposalNumber),
            title: p.proposalTitle ?? '',
            directorName: p.directorName ?? '',
            voteFor: p.votingResults.for.shares,
            voteAgainst: p.votingResults.against.shares,
            voteAbstain: p.votingResults.abstain.shares,
            percentFor: p.votingResults.for.percentage,
            percentAgainst: p.votingResults.against.percentage,
            percentAbstain: p.votingResults.abstain.percentage,
            percentOfOutstanding:
              (p.votingResults.for.shares /
                (votingSummary?.totalSharesOutstanding || 1)) *
              100,
            percentOfTotalVoted:
              (p.votingResults.for.shares / (votingSummary?.totalSharesVoted || 1)) * 100,
            percentOfProposalVotes: p.votingResults.for.percentage,
          })),
        },
        clientTicker: currentMeeting.ticker,
      })
    } catch (error) {
      console.error('Failed to export tabulation report:', error)
    }
  }

  return (
    <FeatureTile
      title="Prelimimary Tabulation Report"
      description="Results for each proposal, showing vote counts, percentages, and quorum status."
      icon={<IconForFileType fileType="PDF" />}
      variant="tertiary"
      actionText="Download"
      onClick={handleDownload}
    />
  )
}
