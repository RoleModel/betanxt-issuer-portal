'use client'

import React from 'react'
import SharesVotedChart from '@/components/Meeting/SharesVotedChart'

interface SharesVotedCardProps {
  meetingId: string
  loading?: boolean
}

export default function SharesVotedCard({ meetingId, loading }: SharesVotedCardProps) {
  return <SharesVotedChart meetingId={meetingId} loading={loading} />
}
