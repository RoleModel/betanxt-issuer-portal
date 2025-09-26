// Server component wrapper for Documents listing; underlying heavy UI is client-only.
import React from 'react'

import DocumentsClientWrapper from '@/components/Documents/DocumentsClientWrapper'

// Optionally control ISR at the segment level (60s heuristic for listing updates)
export const revalidate = 60

interface PageProps {
  params: Promise<{ clientTicker: string; meetingId: string }>
}

export default async function DocumentsPage({ params }: PageProps) {
  const { meetingId } = await params
  return <DocumentsClientWrapper meetingId={meetingId} />
}
