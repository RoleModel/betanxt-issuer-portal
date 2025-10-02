'use client'

import React, { useMemo } from 'react'

import { Box, Card, CardContent, CardHeader, Skeleton } from '@mui/material'
import { PieChart } from '@mui/x-charts/PieChart'

import PieCenterLabel from '@/components/Reporting/PieChartCenterLabel'

import { useVotingTabulation } from '@/hooks/useVotingTabulation'

interface VotingActivityCardProps {
  meetingId: string
}

export default function VotingActivityCard({ meetingId }: VotingActivityCardProps) {
  const { votingSummary, loading } = useVotingTabulation(meetingId)

  const votingMethodsData = useMemo(() => {
    if (!votingSummary) return []

    // Build array of voting methods from actual API data
    const methods = []

    // Add web votes if present
    if (votingSummary.votingMethods.web > 0) {
      methods.push({
        id: 'web',
        label: 'Web',
        value: votingSummary.votingMethods.web,
        color: 'var(--mui-palette-chartSeries-0-main)',
      })
    }

    // Add paper votes if present
    if (votingSummary.votingMethods.paper > 0) {
      methods.push({
        id: 'paper',
        label: 'Paper',
        value: votingSummary.votingMethods.paper,
        color: 'var(--mui-palette-chartSeries-1-main)',
      })
    }

    // Add phone (IVR) votes if present
    if (votingSummary.votingMethods.phone > 0) {
      methods.push({
        id: 'phone',
        label: 'Phone',
        value: votingSummary.votingMethods.phone,
        color: 'var(--mui-palette-chartSeries-2-main)',
      })
    }

    // Return the methods array (already filtered for values > 0)
    return methods
  }, [votingSummary])

  const total = votingMethodsData.reduce((sum, item) => sum + item.value, 0)

  const pieChartData = votingMethodsData.map((item, index) => ({
    ...item,
    id: index,
  }))

  return (
    <Card sx={{ flex: 1 }}>
      <CardHeader title="Voting Activity" />
      <CardContent>
        {loading ? (
          <Skeleton variant="rectangular" height={250} />
        ) : votingMethodsData.length === 0 ? (
          <Box
            sx={{
              height: 250,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
            }}
          >
            No voting activity data available
          </Box>
        ) : (
          <Box>
            <PieChart
              series={[
                {
                  data: pieChartData,
                  innerRadius: 75,
                  outerRadius: 100,
                  highlightScope: { fade: 'global', highlight: 'item' },
                },
              ]}
              width={330}
              height={250}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
              slotProps={{
                legend: {
                  direction: 'horizontal',
                  position: { vertical: 'bottom', horizontal: 'center' },
                },
              }}
            >
              <PieCenterLabel
                data={{
                  total,
                  label: 'Votes',
                  sliceData: pieChartData,
                }}
              />
            </PieChart>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
