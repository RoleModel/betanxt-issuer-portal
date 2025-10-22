'use client'

import React from 'react'

import { Card, CardActionArea, CardContent, Link, Stack, Typography } from '@mui/material'

import type { components } from '@/domain-models/generated-schema'

import type { Client } from '@/hooks/useClients'

type Meeting = components['schemas']['Meeting']

interface DocumentHostingCardProps {
  meeting?: Meeting
  client?: Client
  className?: string
}

interface SiteHostingButtonProps {
  label: string
  url: string
}

const SiteHostingButton = ({ label, url }: SiteHostingButtonProps) => {
  const isPhoneNumber = url.startsWith('1-800') || url.startsWith('+1')
  const isDisabled = !url

  const handleClick = () => {
    if (isDisabled) return
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
        cursor: isDisabled ? 'default' : 'pointer',
      }}
    >
      <CardActionArea disabled={isDisabled}>
        <CardContent>
          <Typography variant="h5" fontWeight="medium" gutterBottom>
            {label}
          </Typography>
          {!isPhoneNumber && !!url && (
            <Link
              sx={{
                wordBreak: 'break-all',
                overflowWrap: 'break-word',
                wordWrap: 'break-word',
              }}
              variant="body3"
              fontWeight={500}
              href={url}
              target="_blank"
            >
              {url}
            </Link>
          )}
          {!isPhoneNumber && !url && (
            <Typography variant="body3" color="text.secondary" fontWeight={500}>
              Not available
            </Typography>
          )}
          {isPhoneNumber && (
            <Typography variant="body3" color="text.secondary" fontWeight={500}>
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
  // Generate dynamic URLs based on client branding and ticker
  const hostingSite = {
    label: 'Document Hosting Site',
    url: `https://www.proxydocs.com/${meeting?.ticker}`,
    status: meeting?.status,
    hasUrl: true,
  }

  // Generate proxy push URL based on ticker
  const eVoteSite = {
    label: 'eVote Site',
    url: meeting?.ticker ? `https://www.proxypush.com/${meeting?.ticker}` : '',
    status: meeting?.status,
    hasUrl: true,
  }

  const ivrNumber = {
    label: `IVR Dial-In`,
    url: meeting?.ivrDialInNumber ?? '',
    status: meeting?.status,
    hasUrl: false,
  }

  // Always show all sites; disable click when URL is missing
  const sites = [hostingSite, eVoteSite, ivrNumber]

  return (
    <Card className={className} sx={{ height: 'auto', gridArea: 'documentLinks' }}>
      <CardContent>
        <Stack spacing={1.5}>
          {sites.map((site, index) => (
            <SiteHostingButton key={index} label={site.label} url={site.url} />
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}
