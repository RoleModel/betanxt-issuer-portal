'use client'

import dynamic from 'next/dynamic'
import React from 'react'

import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Link,
  Typography,
} from '@mui/material'

import RevisionRequestDialog from '@/components/Documents/RevisionRequestDialog'
import StatusChip from '@/components/ui/StatusChip'

import { useClient } from '@/contexts/ClientContext'
import { useMeeting } from '@/contexts/MeetingContext'

const DocumentViewer = dynamic(() => import('@/components/Documents/DocumentViewer'), {
  ssr: false,
})

export default function DocumentSiteCard() {
  const { currentMeeting } = useMeeting()
  const { currentClient } = useClient()

  const [hostingSiteStatus, setHostingSiteStatus] = React.useState<string>('Incomplete')
  const [revisionDialogOpen, setRevisionDialogOpen] = React.useState(false)
  const [hostingSiteViewerOpen, setHostingSiteViewerOpen] = React.useState(false)

  const handleViewHostingSite = () => {
    setHostingSiteViewerOpen(true)
  }

  const handleHostingSiteViewerClose = () => {
    setHostingSiteViewerOpen(false)
  }

  const handleRevisionRequest = () => {
    setRevisionDialogOpen(true)
  }

  const handleRevisionSubmit = async (revisionRequest: string): Promise<void> => {
    try {
      // TODO: Implement API call to submit revision request
      setRevisionDialogOpen(false)
      // Update status to indicate revision was requested
      setHostingSiteStatus('Revision Requested')
    } catch (error) {
      console.error('Failed to submit revision request:', error)
      throw error
    }
  }

  const handleApproveSite = async (): Promise<void> => {
    try {
      setHostingSiteStatus('Approved')
      setHostingSiteViewerOpen(false)
    } catch (_err) {
      // no-op
    }
  }

  const derivedYear = (
    currentMeeting?.meetingYear ??
    (currentMeeting?.meetingDate
      ? new Date(currentMeeting.meetingDate).getFullYear()
      : new Date().getFullYear())
  ).toString()
  const viewerUrl =
    currentClient?.branding_id && derivedYear
      ? `https://www.proxydocs.com/branding/${currentClient.branding_id}/${derivedYear}/issuer/`
      : undefined

  return (
    <>
      <Card sx={{ height: 'auto' }}>
        <CardContent>
          <Box
            sx={{
              p: 2,
              backgroundColor: 'background.default',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'start',
              gap: 2,
            }}
          >
            <Typography variant="h4" component="p">
              Document Hosting Site
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Verify all shareholder facing sites, you will use the test control number
              (123456782) to enter the voting site. Once approved, sites will be made
              active in conjunction with the filing mailing date.
            </Typography>
            {viewerUrl && (
              <Link href={viewerUrl} target="_blank">
                View Document Hosting Site
              </Link>
            )}
            <StatusChip status={hostingSiteStatus} />
          </Box>
        </CardContent>
        <CardActions>
          <Button
            variant="outlined"
            onClick={handleViewHostingSite}
            sx={{ textTransform: 'none' }}
          >
            View Site
          </Button>
          <Button variant="outlined" onClick={handleRevisionRequest}>
            Request Revision
          </Button>
        </CardActions>
      </Card>

      <DocumentViewer
        open={hostingSiteViewerOpen}
        onClose={handleHostingSiteViewerClose}
        pdfUrl={viewerUrl || ''}
        title="Document Hosting Site"
        isWebsiteView={true}
        onApproveSite={handleApproveSite}
        onRequestRevision={handleRevisionRequest}
      />

      <RevisionRequestDialog
        open={revisionDialogOpen}
        onClose={() => setRevisionDialogOpen(false)}
        onSubmit={handleRevisionSubmit}
        title="Request Site Revision"
        description="Please describe the revisions needed for the document hosting site."
      />
    </>
  )
}
