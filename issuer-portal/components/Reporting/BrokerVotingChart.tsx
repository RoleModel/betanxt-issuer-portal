'use client'

import React, { useState } from 'react'

import { Card, CardContent, CardHeader, MenuItem, TextField } from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'

import { EmptyState } from '@/components/EmptyState'

interface BrokerVotingData {
  broker: string
  for: number
  against: number
  abstain: number
  total: number
}

interface Proposal {
  id: string
  proposalNumber: string
  proposalTitle: string
}

interface BrokerVotingChartProps {
  meetingId?: string
  proposals?: Proposal[]
  brokerData?: Record<string, BrokerVotingData[]>
}

export default function BrokerVotingChart({
  proposals = [],
  brokerData = {},
}: BrokerVotingChartProps) {
  const [selectedProposalId, setSelectedProposalId] = useState<string>('')

  React.useEffect(() => {
    if (proposals.length > 0 && !selectedProposalId) {
      setSelectedProposalId(proposals[0].id)
    }
  }, [proposals, selectedProposalId])

  // Map generic proposal keys (proposal1, proposal2) to actual proposal IDs based on order
  const mappedBrokerData = React.useMemo(() => {
    const mapped: Record<string, BrokerVotingData[]> = {}

    // Sort proposals by proposal number to get consistent order
    const sortedProposals = [...proposals].sort((a, b) => {
      const numA = parseFloat(a.proposalNumber.toString()) || 0
      const numB = parseFloat(b.proposalNumber.toString()) || 0
      return numA - numB
    })

    Object.entries(brokerData).forEach(([key, data]) => {
      // Map "proposal1" -> first proposal, "proposal2" -> second proposal, etc.
      const proposalIndex = parseInt(key.replace('proposal', '')) - 1
      if (proposalIndex >= 0 && proposalIndex < sortedProposals.length) {
        const proposalId = sortedProposals[proposalIndex]?.id
        if (proposalId) {
          mapped[proposalId] = data
        }
      }
    })

    return mapped
  }, [brokerData, proposals])

  // Get broker data for selected proposal
  const data =
    selectedProposalId && mappedBrokerData[selectedProposalId]
      ? mappedBrokerData[selectedProposalId]
      : []
  const hasData = Object.keys(mappedBrokerData).length > 0

  if (proposals.length === 0) {
    return (
      <Card>
        <CardHeader title="Broker Voting by Proposal" />
        <CardContent>
          <EmptyState
            title="No proposals available"
            description="Broker voting data will appear when proposals are available."
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        title="Broker Voting by Proposal"
        action={
          <TextField
            select
            size="small"
            label="Proposal"
            value={selectedProposalId}
            onChange={(e) => setSelectedProposalId(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            {proposals.map((proposal) => (
              <MenuItem key={proposal.id} value={proposal.id}>
                {proposal.proposalNumber} - {proposal.proposalTitle}
              </MenuItem>
            ))}
          </TextField>
        }
      />
      <CardContent>
        {!hasData ? (
          <EmptyState
            title="No broker voting data available"
            description="Broker voting data will appear when available."
          />
        ) : data.length === 0 ? (
          <EmptyState
            title="No broker voting data for this proposal"
            description="Please select a different proposal."
          />
        ) : (
          <BarChart
            layout="horizontal"
            xAxis={[
              {
                scaleType: 'linear',
                tickMinStep: 6,
              },
            ]}
            yAxis={[
              {
                scaleType: 'band',
                data: data.map((d) => d.broker),
                width: 100,
              },
            ]}
            series={[
              {
                data: data.map((d) => d.for),
                label: 'For',
                stack: 'total',
                color: 'var(--mui-palette-chartSeries-1-main)',
              },
              {
                data: data.map((d) => d.against),
                label: 'Against',
                stack: 'total',
                color: 'var(--mui-palette-chartSeries-5-main)',
              },
              {
                data: data.map((d) => d.abstain),
                label: 'Abstain',
                stack: 'total',
                color: 'var(--mui-palette-neutral-dark)',
              },
            ]}
            height={Math.max(300, data.length * 50 + 75)}
            margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
            grid={{ vertical: true, horizontal: false }}
            slotProps={{
              legend: {
                direction: 'horizontal',
                position: { vertical: 'bottom', horizontal: 'center' },
              },
            }}
          />
        )}
      </CardContent>
    </Card>
  )
}
