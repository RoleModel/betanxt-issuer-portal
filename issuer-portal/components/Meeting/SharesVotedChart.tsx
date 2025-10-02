'use client'

import React, { useMemo } from 'react'

import { Box, Card, CardContent, CardHeader, Typography } from '@mui/material'
import { PieChart } from '@mui/x-charts/PieChart'

import PieCenterLabel from '@/components/Reporting/PieChartCenterLabel'

import { useVotingTabulation } from '@/hooks/useVotingTabulation'

interface SharesVotedChartProps {
  meetingId?: string
  loading?: boolean
}

export default function SharesVotedChart({
  meetingId,
  loading = false,
}: SharesVotedChartProps) {
  const { votingSummary, loading: votingLoading } = useVotingTabulation(meetingId)

  const { percentage, votingBreakdownData } = useMemo(() => {
    if (!votingSummary) {
      return { percentage: 0, votingBreakdownData: [] }
    }

    // Check if we have actual voting breakdown data
    const hasVotingData =
      votingSummary.votingBreakdown.for.shares > 0 ||
      votingSummary.votingBreakdown.against.shares > 0 ||
      votingSummary.votingBreakdown.abstain.shares > 0

    if (!hasVotingData) {
      // If no voting breakdown data, show just the voted vs unvoted
      const totalVoted = votingSummary.totalSharesVoted
      const totalUnvoted =
        votingSummary.totalSharesOutstanding - votingSummary.totalSharesVoted

      return {
        percentage: votingSummary.percentageVoted,
        votingBreakdownData: [
          {
            id: 'voted',
            label: 'Voted',
            value: totalVoted,
            color: 'var(--mui-palette-chartSeries-0-main)',
          },
          {
            id: 'unvoted',
            label: 'Unvoted',
            value: totalUnvoted,
            color: 'var(--mui-palette-chartSeries-4-main)',
          },
        ].filter((item) => item.value > 0),
      }
    }

    return {
      percentage: votingSummary.percentageVoted,
      votingBreakdownData: [
        {
          id: 'for',
          label: 'For',
          value: votingSummary.votingBreakdown.for.shares,
          color: 'var(--mui-palette-chartSeries-0-main)',
        },
        {
          id: 'against',
          label: 'Against',
          value: votingSummary.votingBreakdown.against.shares,
          color: 'var(--mui-palette-chartSeries-1-main)',
        },
        {
          id: 'abstain',
          label: 'Abstain',
          value: votingSummary.votingBreakdown.abstain.shares,
          color: 'var(--mui-palette-chartSeries-2-main)',
        },
      ].filter((item) => item.value > 0),
    }
  }, [votingSummary])

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
    <Card sx={{ flex: 1 }}>
      <CardHeader title="Shares Voted" />
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          {/* MUI X Charts Pie Chart */}
          <Box sx={{ position: 'relative' }}>
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
              margin={{ top: 20, bottom: 20, left: 20, right: 20 }}
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
        </Box>
      </CardContent>
    </Card>
  )
}
