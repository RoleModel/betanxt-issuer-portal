'use client'

import SharesVotedChart from '@/components/Meeting/SharesVotedChart'

import type { VotingSummary } from '@/types/phases'

interface SharesVotedCardProps {
  meetingId: string
  loading?: boolean
  votingSummaryOverride?: VotingSummary | null
}

export default function SharesVotedCard({
  meetingId,
  loading,
  votingSummaryOverride,
}: SharesVotedCardProps) {
  return (
    <SharesVotedChart
      meetingId={meetingId}
      loading={loading}
      votingSummaryOverride={votingSummaryOverride}
    />
  )
}
