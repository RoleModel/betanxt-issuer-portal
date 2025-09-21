'use client'

import React from 'react'

import {
  Card,
  CardActionArea,
  CardContent,
  Link,
  Stack,
  Typography,
} from '@mui/material'

import { components } from '@/domain-models/generated-schema'

type Meeting = components['schemas']['Meeting']

interface DocumentHostingCardProps {
  meeting?: Meeting
  className?: string
}

interface SiteHostingButtonProps {
  label: string
  url: string
  hasUrl: boolean
}

const SiteHostingButton = ({ label, url, hasUrl }: SiteHostingButtonProps) => {
  const isPhoneNumber = url.startsWith('1-800') || url.startsWith('+1')

  const handleClick = () => {
    if (isPhoneNumber) {
      window.open(`tel:${url}`, '_self')
    } else {
      window.open(url, '_blank')
    }
  }

  return (
    <Card
      variant="outlined"
      onClick={handleClick}
      sx={{
        backgroundColor: 'background.default',
        cursor: 'pointer',
      }}
    >
      <CardActionArea>
        <CardContent>
          <Typography variant="h5" fontWeight="medium" gutterBottom>
            {label}
          </Typography>
          {hasUrl && (
            <Link variant="body3" href={url} target="_blank">
              {url}
            </Link>
          )}
          {!hasUrl && (
            <Typography variant="body3" color="text.secondary">
              {url}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

export default function DocumentHostingCard({
  meeting,
  className,
}: DocumentHostingCardProps) {
  // Get year from meetingYear or derive from meetingDate, fallback to 2024
  const getYear = () => {
    if (meeting?.meetingYear) return meeting.meetingYear
    if (meeting?.meetingDate) return new Date(meeting.meetingDate).getFullYear()
    return 2024
  }

  // Generate dynamic URLs based on client branding and ticker
  const hostingSite = {
    label: 'Document Hosting Site',
    url: meeting?.client?.brandingId
      ? `https://www.proxydocs.com/branding/${meeting.client.brandingId}/${getYear()}/issuer/`
      : '',
    status: meeting?.status,
    hasUrl: true,
  }

  // Generate proxy push URL based on ticker
  const eVoteSite = {
    label: 'eVote Site',
    url: meeting?.ticker ? `https://www.proxypush.com/evote/${meeting.ticker}/login` : '',
    status: meeting?.status,
    hasUrl: true,
  }

  const ivrNumber = {
    label: `IVR Dial-In`,
    url: meeting?.ivrDialInNumber || '',
    status: meeting?.status,
    hasUrl: false,
  }

  // Only show sites that have URLs
  const sites = [hostingSite, eVoteSite, ivrNumber].filter((site) => site.url)

  return (
    <Card
      className={className}
      sx={{ height: 'auto', gridArea: 'documentLinks', alignSelf: 'start' }}
    >
      <CardContent>
        <Stack spacing={1.5}>
          {sites.map((site, index) => (
            <SiteHostingButton
              key={index}
              label={site.label}
              url={site.url}
              hasUrl={site.hasUrl}
            />
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}
