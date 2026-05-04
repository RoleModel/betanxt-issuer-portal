'use client'

import React, { useMemo } from 'react'

import { Box, Card, CardContent, CardHeader, Skeleton } from '@mui/material'
import { PieChart } from '@mui/x-charts/PieChart'

import PieCenterLabel from '@/components/Reporting/PieChartCenterLabel'

import { useVotingTabulation } from '@/hooks/useVotingTabulation'
import type { VotingSummary } from '@/types/phases'

interface VotingActivityCardProps {
  meetingId: string
  votingSummaryOverride?: VotingSummary | null
  loadingOverride?: boolean
}

export default function VotingActivityCard({
  meetingId,
  votingSummaryOverride,
  loadingOverride = false,
}: VotingActivityCardProps) {
  const { votingSummary, loading } = useVotingTabulation(meetingId)
  const resolvedSummary = votingSummaryOverride ?? votingSummary

  const votingMethodsData = useMemo(() => {
    if (!resolvedSummary) return []

    // Build array of voting methods from actual API data
    const methods: {
      id: string
      label: string
      value: number
      color: string
    }[] = []

    // Add web votes if present
    if (resolvedSummary.votingMethods.web > 0) {
      methods.push({
        id: 'web',
        label: 'Web',
        value: resolvedSummary.votingMethods.web,
        color: 'var(--mui-palette-chartSeries-0-main)',
      })
    }

    // Add print votes if present (labeled as "Print" to match CSV data)
    if (resolvedSummary.votingMethods.paper > 0) {
      methods.push({
        id: 'print',
        label: 'Print',
        value: resolvedSummary.votingMethods.paper,
        color: 'var(--mui-palette-chartSeries-1-main)',
      })
    }

    // Add IVR votes if present (labeled as "IVR" to match CSV data)
    if (resolvedSummary.votingMethods.phone > 0) {
      methods.push({
        id: 'ivr',
        label: 'IVR',
        value: resolvedSummary.votingMethods.phone,
        color: 'var(--mui-palette-chartSeries-2-main)',
      })
    }

    // Return the methods array (already filtered for values > 0)
    return methods
  }, [resolvedSummary])

  const total = votingMethodsData.reduce((sum, item) => sum + item.value, 0)

  const pieChartData = votingMethodsData.map((item, index) => ({
    ...item,
    id: index,
  }))

  return (
    <Card sx={{ flex: 1, height: '100%' }}>
      <CardHeader title="Voting Activity" />
      <CardContent>
        {loading || loadingOverride ? (
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
                  data: pieChartData,
                  innerRadius: 75,
                  outerRadius: 100,
                  highlightScope: { fade: 'global', highlight: 'item' },
                },
              ]}
              width={250}
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
