import React from 'react'

import DocumentsSection from '@/components/Documents/DocumentsSection'

export const revalidate = 60

interface PageProps {
  params: Promise<{ clientTicker: string; meetingId: string }>
}

export default async function DocumentsPage({ params }: PageProps) {
  return <DocumentsSection params={params} />
}
