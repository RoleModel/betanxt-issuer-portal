'use client'

import React, { useState } from 'react'

import { Card, CardContent, CardHeader, Tab, Tabs } from '@mui/material'

import VotingTabulationTable from '@/components/Meeting/VotingTabulationTable'

import { useVotingTabulation } from '@/hooks/useVotingTabulation'

import DetailedTabulationTable from './DetailedTabulationTable'

interface ProposalDetailsCardProps {
  meetingId: string
}

export default function ProposalDetailsCard({ meetingId }: ProposalDetailsCardProps) {
  const { proposals, loading } = useVotingTabulation(meetingId)
  const [selectedTab, setSelectedTab] = useState(0)

  const filteredProposals =
    selectedTab === 1 ? proposals.filter((p) => p.directorName) : proposals

  return (
    <Card>
      <CardHeader title="Tabulation" />
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
        <Tabs
          value={selectedTab}
          onChange={(_, val) => setSelectedTab(val)}
          sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" />
          <Tab label="Proposal Details" />
        </Tabs>

        {selectedTab === 0 ? (
          <VotingTabulationTable proposals={filteredProposals} loading={loading} />
        ) : (
          <DetailedTabulationTable meetingId={meetingId} />
        )}
      </CardContent>
    </Card>
  )
}
