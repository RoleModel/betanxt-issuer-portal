'use client'

import React from 'react'

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Typography,
} from '@mui/material'
import { PieChart as MuiPieChart } from '@mui/x-charts/PieChart'

import PieCenterLabel from '@/components/Reporting/PieChartCenterLabel'

interface VoteDistributionData {
  id: string
  label: string
  value: number
  color: string
}

interface VoteDistributionChartProps {
  data: VoteDistributionData[]
  loading?: boolean
}

export default function VoteDistributionChart({
  data,
  loading,
}: VoteDistributionChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  if (loading) {
    return (
      <Card sx={{ flex: '1 0 auto' }}>
        <CardHeader title="Vote Distribution by Account Type" />
        <CardContent>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height={300}
            gap={2}
          >
            <CircularProgress />
            <Typography variant="body3" color="text.secondary">
              Loading vote distribution data...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader title="Vote Distribution by Account Type" />
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="center" height={300}>
            <Typography variant="body1" color="text.secondary">
              No vote distribution data available
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  // Normalize ids to numeric values for components expecting number ids
  const pieChartData = data.map((item, index) => ({
    ...item,
    id: index,
  }))

  return (
    <Card>
      <CardHeader title="Vote Distribution by Account Type" />
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="center">
          <MuiPieChart
            series={[
              {
                data: pieChartData,
                innerRadius: 75,
                outerRadius: 100,
                highlightScope: { fade: 'global', highlight: 'item' },
              },
            ]}
            height={300}
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
                label: 'Total Votes',
                sliceData: pieChartData,
              }}
            />
          </MuiPieChart>
        </Box>
      </CardContent>
    </Card>
  )
}
