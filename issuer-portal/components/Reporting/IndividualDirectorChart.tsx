'use client'

import React from 'react'

import { Box, CircularProgress, Typography, useTheme } from '@mui/material'
import { BarChart } from '@mui/x-charts'

interface IndividualDirectorData {
  directorName: string
  proposalTitle: string
  forVotes: number
  againstVotes: number
  abstainVotes: number
  totalVotes: number
  finalResult: string
}

interface IndividualDirectorChartProps {
  data: IndividualDirectorData[]
  loading?: boolean
  title?: string
  selectedDirector?: string
}

const IndividualDirectorChart: React.FC<IndividualDirectorChartProps> = ({
  data,
  loading = false,
  title: _title = 'Individual Director Performance',
  selectedDirector,
}) => {
  const theme = useTheme()

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height={300}
        gap={2}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Loading individual director data...
        </Typography>
      </Box>
    )
  }

  // Filter data for selected director if specified
  const filteredData = selectedDirector
    ? data.filter((item) => item.directorName === selectedDirector)
    : data

  if (!filteredData || filteredData.length === 0) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height={300}>
        <Typography variant="body1" color="text.secondary">
          {selectedDirector
            ? `No data available for director: ${selectedDirector}`
            : 'No individual director data available'}
        </Typography>
      </Box>
    )
  }

  const chartData = filteredData.map((item) => {
    const total = item.totalVotes || item.forVotes + item.againstVotes + item.abstainVotes
    return {
      proposalTitle:
        item.proposalTitle.length > 30
          ? `${item.proposalTitle.substring(0, 30)}...`
          : item.proposalTitle,
      forPercentage: total > 0 ? Math.round((item.forVotes / total) * 100) : 0,
      againstPercentage: total > 0 ? Math.round((item.againstVotes / total) * 100) : 0,
      abstainPercentage: total > 0 ? Math.round((item.abstainVotes / total) * 100) : 0,
      result: item.finalResult,
    }
  })

  const proposalTitles = chartData.map((item) => item.proposalTitle)
  const forPercentageData = chartData.map((item) => item.forPercentage)
  const againstPercentageData = chartData.map((item) => item.againstPercentage)
  const abstainPercentageData = chartData.map((item) => item.abstainPercentage)

  return (
    <Box>
      {selectedDirector && (
        <Typography variant="h6" sx={{ mb: 2 }}>
          {selectedDirector} - Voting History
        </Typography>
      )}
      <BarChart
        height={Math.max(300, filteredData.length * 40)}
        layout="horizontal"
        series={[
          {
            data: forPercentageData,
            label: 'For',
            color: theme.palette.success?.main || '#4caf50',
            stack: 'votes',
          },
          {
            data: againstPercentageData,
            label: 'Against',
            color: theme.palette.error?.main || '#f44336',
            stack: 'votes',
          },
          {
            data: abstainPercentageData,
            label: 'Abstain',
            color: theme.palette.warning?.main || '#ff9800',
            stack: 'votes',
          },
        ]}
        yAxis={[
          {
            data: proposalTitles,
            scaleType: 'band',
            tickSize: 7,
            tickLabelStyle: {
              fontSize: 11,
              width: 200,
            },
          },
        ]}
        xAxis={[
          {
            min: 0,
            max: 100,
            tickNumber: 6,
          },
        ]}
        margin={{ left: 200, right: 10, top: 10, bottom: 40 }}
        grid={{ vertical: true, horizontal: true }}
        slotProps={{
          legend: {
            direction: 'horizontal',
            position: { vertical: 'bottom', horizontal: 'center' },
          },
        }}
      />
    </Box>
  )
}

export default IndividualDirectorChart
