'use client'

import dynamic from 'next/dynamic'
import React, { Suspense } from 'react'

import { LinearProgress } from '@mui/material'

// Dynamically load the heavy DocumentsSection only on the client.
// We keep dynamic import confined to a client boundary to satisfy Next.js 15 constraints.
const DocumentsSection = dynamic(() => import('./DocumentsSection'), {
  loading: () => <LinearProgress />,
  ssr: false,
})

export interface DocumentsClientWrapperProps {
  meetingId: string
}

export default function DocumentsClientWrapper({
  meetingId,
}: DocumentsClientWrapperProps) {
  return (
    <Suspense fallback={<LinearProgress />}>
      <DocumentsSection params={Promise.resolve({ meetingId })} />
    </Suspense>
  )
}
