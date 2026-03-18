'use client'

import React, { useMemo } from 'react'

import { Box, Card, CardContent, CardHeader, Typography } from '@mui/material'
import { PieChart } from '@mui/x-charts/PieChart'

import PieCenterLabel from '@/components/Reporting/PieChartCenterLabel'

import { useVotingTabulation } from '@/hooks/useVotingTabulation'
import type { VotingSummary } from '@/types/phases'

interface SharesVotedChartProps {
  meetingId?: string
  loading?: boolean
  votingSummaryOverride?: VotingSummary | null
}

export default function SharesVotedChart({
  meetingId,
  loading = false,
  votingSummaryOverride,
}: SharesVotedChartProps) {
  const { votingSummary, loading: votingLoading } = useVotingTabulation(meetingId)
  const resolvedSummary = votingSummaryOverride ?? votingSummary

  const { percentage, votingBreakdownData } = useMemo(() => {
    if (!resolvedSummary) {
      return { percentage: 0, votingBreakdownData: [] }
    }

    // Check if we have actual voting breakdown data
    const hasVotingData =
      resolvedSummary.votingBreakdown.for.shares > 0 ||
      resolvedSummary.votingBreakdown.against.shares > 0 ||
      resolvedSummary.votingBreakdown.abstain.shares > 0

    if (!hasVotingData) {
      // If no voting breakdown data, show just the voted vs unvoted
      const totalVoted = resolvedSummary.totalSharesVoted
      const totalUnvoted =
        resolvedSummary.totalSharesOutstanding - resolvedSummary.totalSharesVoted

      return {
        percentage: resolvedSummary.percentageVoted,
        votingBreakdownData: [
          {
            id: 'voted',
            label: 'Voted',
            value: totalVoted,
            color: 'var(--mui-palette-chartSeries-0-main)',
          },
          {
            id: 'unvoted',
            label: 'Not Voted',
            value: totalUnvoted,
            color: 'var(--mui-palette-chartSeries-4-main)',
          },
        ].filter((item) => item.value > 0),
      }
    }

    return {
      percentage: resolvedSummary.percentageVoted,
      votingBreakdownData: [
        {
          id: 'for',
          label: 'For',
          value: resolvedSummary.votingBreakdown.for.shares,
          color: 'var(--mui-palette-chartSeries-0-main)',
        },
        {
          id: 'against',
          label: 'Against',
          value: resolvedSummary.votingBreakdown.against.shares,
          color: 'var(--mui-palette-chartSeries-1-main)',
        },
        {
          id: 'abstain',
          label: 'Abstain',
          value: resolvedSummary.votingBreakdown.abstain.shares,
          color: 'var(--mui-palette-chartSeries-2-main)',
        },
      ].filter((item) => item.value > 0),
    }
  }, [resolvedSummary])

  if (loading || votingLoading) {
    return (
      <Card>
        <CardHeader title="Shares Voted" />
        <CardContent>
          <Typography>Loading...</Typography>
        </CardContent>
      </Card>
    )
  }

  // Use the voting breakdown data

  return (
    <Card sx={{ flex: 1, height: '100%' }}>
      <CardHeader title="Shares Voted" />
      <CardContent>
        <Box
          sx={{
            minHeight: 250,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary',
          }}
        >
          <PieChart
            series={[
              {
                data: votingBreakdownData,
                innerRadius: 75,

                outerRadius: 100,
                highlightScope: { fade: 'global', highlight: 'item' },
              },
            ]}
            width={250}
            height={250}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            hideLegend={false}
            slotProps={{
              legend: {
                direction: 'horizontal',
                position: { vertical: 'bottom', horizontal: 'center' },
              },
            }}
          >
            <PieCenterLabel
              data={{
                total: percentage,
                label: 'Voted',
                centerPercentage: `${percentage}%`,
                sliceData: votingBreakdownData.map((item, index) => ({
                  id: index,
                  value: item.value,
                  label: item.label,
                  color: item.color,
                })),
              }}
            />
          </PieChart>
        </Box>
      </CardContent>
    </Card>
  )
}
