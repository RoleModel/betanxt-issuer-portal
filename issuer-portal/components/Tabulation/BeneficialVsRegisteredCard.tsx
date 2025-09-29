'use client'

import React, { useEffect, useMemo, useState } from 'react'

import { Box, Card, CardContent, CardHeader, Skeleton } from '@mui/material'
import { styled } from '@mui/material/styles'
import { BarChart, BarLabelProps } from '@mui/x-charts/BarChart'

import buildApiClient from '@/domain-models/apiClient'

import { formatNumber } from '@/utils/numberUtils'
import { asArray, asRecord, asString } from '@/utils/typeUtils'

interface Position {
  accountType: string
  voteStatus: string
  shares: number
}

interface BeneficialVsRegisteredCardProps {
  meetingId: string
}

const toFiniteNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const toStringValue = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  const str = asString(value)
  return str ?? String(value)
}

const normalizePosition = (value: unknown): Position | null => {
  const record = asRecord(value)
  if (!record) return null

  return {
    accountType: toStringValue(record.accountType),
    voteStatus: toStringValue(record.voteStatus),
    shares: toFiniteNumber(record.shares),
  }
}

const StyledText = styled('text')(({ theme }) => ({
  ...theme.typography.body2,
  stroke: 'none',
  fill: (theme.vars || theme)?.palette?.text?.primary,
  textAnchor: 'middle',
  dominantBaseline: 'central',
  pointerEvents: 'none',
}))

function CustomBarLabel(props: BarLabelProps) {
  const { x, y, width, children, ...otherProps } = props

  return (
    <StyledText {...otherProps} x={x + width / 2} y={y - 8} textAnchor="middle">
      {formatNumber(Number(children) || 0)}
    </StyledText>
  )
}

export default function BeneficialVsRegisteredCard({
  meetingId,
}: BeneficialVsRegisteredCardProps) {
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!meetingId) return

    const fetchPositions = async () => {
      setLoading(true)
      try {
        const apiClient = await buildApiClient()
        const { data, error } = await apiClient.GET('/positions', {
          params: {
            query: { meetingId },
          },
        })

        if (error) {
          console.error('Failed to fetch positions:', error)
          return
        }

        if (data) {
          const rawData: unknown[] = Array.isArray(data)
            ? data
            : asArray(asRecord(data)?.positions)

          const positionsList = rawData.reduce<Position[]>((acc, item) => {
            const normalized = normalizePosition(item)
            if (normalized) acc.push(normalized)
            return acc
          }, [])

          setPositions(positionsList)
        }
      } catch (error) {
        console.error('Failed to fetch positions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPositions()
  }, [meetingId])

  const chartData = useMemo(() => {
    const nonDtcVoted = positions
      .filter((p) => p.accountType === 'Non-DTC' && p.voteStatus === 'Voted')
      .reduce((sum, p) => sum + p.shares, 0)

    const dtcVoted = positions
      .filter((p) => p.accountType === 'DTC/CDS' && p.voteStatus === 'Voted')
      .reduce((sum, p) => sum + p.shares, 0)

    return {
      beneficial: nonDtcVoted,
      registered: dtcVoted,
    }
  }, [positions])

  return (
    <Card sx={{ flex: 1 }}>
      <CardHeader title="Beneficial vs. Registered" />
      <CardContent>
        {loading ? (
          <Skeleton variant="rectangular" height={300} />
        ) : (
          <Box>
            <BarChart
              xAxis={[
                {
                  scaleType: 'band',
                  data: ['Beneficial', 'Registered'],
                  colorMap: {
                    type: 'ordinal',
                    values: ['Beneficial', 'Registered'],
                    colors: [
                      'var(--mui-palette-chartSeries-0-main)',
                      'var(--mui-palette-chartSeries-1-main)',
                    ],
                  },
                },
              ]}
              series={[
                {
                  data: [chartData.beneficial, chartData.registered],
                },
              ]}
              height={300}
              margin={{ left: 0, right: 0, top: 30, bottom: 0 }}
              hideLegend={true}
              barLabel="value"
              slots={{ barLabel: CustomBarLabel }}
              yAxis={[
                {
                  position: 'none',
                },
              ]}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
