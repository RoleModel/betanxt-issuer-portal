'use client'

import React from 'react'

import { Box, Card, CardContent, CardHeader, Typography, useTheme } from '@mui/material'
import { PieChart } from '@mui/x-charts/PieChart'

import { useMeeting } from '@/contexts/MeetingContext'
import { useVotingTabulation } from '@/hooks/useVotingTabulation'

interface SharesVotedChartProps {
  meetingId?: string
  loading?: boolean
}

export default function SharesVotedChart({
  meetingId,
  loading = false,
}: SharesVotedChartProps) {
  const theme = useTheme()

  // Get position-based data from MeetingContext (same source as TabulationTracker)
  const { positions, positionsLoading } = useMeeting()

  // Get proposal voting breakdown percentages
  const { votingSummary } = useVotingTabulation(meetingId)

  const formatShares = (shares: number) => {
    return shares.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  if (loading || positionsLoading || !votingSummary) {
    return (
      <Card>
        <CardHeader title="Shares Voted" />
        <CardContent>
          <Typography>Loading...</Typography>
        </CardContent>
      </Card>
    )
  }

  // Calculate position-based totals (same as TabulationTracker)
  const totalShares = positions.reduce((sum, p) => sum + (p.shares || 0), 0)
  const votedShares = positions
    .filter((p) => p.voteStatus === 'Voted')
    .reduce((sum, p) => sum + (p.sharesVoted || p.shares || 0), 0)

  const percentage = totalShares > 0 ? Math.round((votedShares / totalShares) * 100) : 0

  // Use the breakdown percentages from proposal data, applied to position-based totals
  const forPercentage = votingSummary.votingBreakdown.for.percentage
  const againstPercentage = votingSummary.votingBreakdown.against.percentage
  const abstainPercentage = votingSummary.votingBreakdown.abstain.percentage

  // Calculate shares using position-based total and proposal percentages
  const forShares = Math.round(votedShares * (forPercentage / 100))
  const againstShares = Math.round(votedShares * (againstPercentage / 100))
  const abstainShares = Math.round(votedShares * (abstainPercentage / 100))

  // Prepare data for MUI X Charts PieChart
  const pieData = [
    {
      id: 'for',
      label: 'For',
      value: forShares,
      color: theme.palette.chartSeries[0].main,
    },
    {
      id: 'against',
      label: 'Against',
      value: againstShares,
      color: theme.palette.chartSeries[3].main,
    },
    {
      id: 'abstain',
      label: 'Abstain',
      value: abstainShares,
      color: theme.palette.chartSeries[2].main,
    },
  ].filter((item) => item.value > 0) // Only show segments with votes

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
                  data: pieData,
                  innerRadius: 75,
                  outerRadius: 100,
                  highlightScope: { fade: 'global', highlight: 'item' },
                  faded: { innerRadius: 45, additionalRadius: -10, color: 'gray' },
                },
              ]}
              width={250}
              height={250}
              margin={{ top: 20, bottom: 20, left: 20, right: 20 }}
              hideLegend={true}
            />
            {/* Center text overlay */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <Typography
                variant="pageTitle"
                sx={{ fontWeight: 'bold', color: 'primary.main' }}
              >
                {percentage}%
              </Typography>
              <Typography variant="body3" color="text.secondary">
                Voted
              </Typography>
            </Box>
          </Box>

          {/* Voting Breakdown */}
          <Box sx={{ width: '100%', textAlign: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.chartSeries[1].main,
                  }}
                />
                <Typography variant="caption">For</Typography>
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                {formatShares(forShares)} ({forPercentage.toFixed(2)}%)
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.chartSeries[3].main,
                  }}
                />
                <Typography variant="caption">Against</Typography>
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                {formatShares(againstShares)} ({againstPercentage.toFixed(2)}%)
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.chartSeries[2].main,
                  }}
                />
                <Typography variant="caption">Abstain</Typography>
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                {formatShares(abstainShares)} ({abstainPercentage.toFixed(2)}%)
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
