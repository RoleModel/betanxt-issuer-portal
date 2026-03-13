'use client'

import { Suspense } from 'react'

import { Grid } from '@mui/material'

import DocumentHostingCard from '@/components/Meeting/DocumentHostingCard'
import KeyDatesCard from '@/components/Meeting/KeyDatesCard'
import QuorumGaugeCard from '@/components/Meeting/QuorumGaugeCard'

import { useVotingTabulation } from '@/hooks/useVotingTabulation'
import type { Meeting } from '@/types/api-exports'
import { buildQuorumGaugeModel } from '@/utils/quorum'

interface Phase1LayoutProps {
  meetingId?: string
  meeting?: Meeting
}

function Phase1Layout({ meeting }: Phase1LayoutProps) {
  const { votingSummary, loading } = useVotingTabulation(meeting?.id)
  const quorumGaugeModel = buildQuorumGaugeModel({
    totalOutstandingShares: votingSummary?.totalSharesOutstanding ?? meeting?.totalSharesOutstanding,
    representedShares: votingSummary?.totalSharesVoted ?? 0,
    quorumRequirementPercent: meeting?.quorumRequirement ?? 50,
  })

  return (
    <Suspense>
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid size={{ xs: 12, md: 6, }}>
          <KeyDatesCard meeting={meeting} />
        </Grid>
        <Grid size={{ xs: 12, md: 3, }}>
          <DocumentHostingCard meeting={meeting} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <QuorumGaugeCard
            title="Percentage to Quorum"
            model={quorumGaugeModel}
            loading={loading}
          />
        </Grid>
      </Grid>
    </Suspense>
  )
}

export default Phase1Layout
