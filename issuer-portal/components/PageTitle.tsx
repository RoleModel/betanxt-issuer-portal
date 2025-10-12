import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Box, Breadcrumbs, Typography } from '@mui/material'
import { Link as MuiLink } from '@mui/material'

export function PageTitle({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname()
  const segments = pathname.replace(/^\/+|\/+$/g, '').split('/')

  // Education and products are now at root level, not under client ticker
  const isEducation = segments[0] === 'education'
  const isProducts = segments[0] === 'products'

  // Check if we're under a client ticker path (for meeting pages)
  const hasClientTicker = segments.length > 0 && /^[A-Z]{2,5}$/.test(segments[0])
  const baseIndex = hasClientTicker ? 1 : 0
  const tickerPrefix = hasClientTicker ? `/${segments[0]}` : ''

  const isMeeting = segments[baseIndex] === 'meeting'
  const isPastMeetings = segments[baseIndex] === 'past-meetings'

  const childSegments = isEducation || isProducts ? segments.slice(1) : []

  const toTitle = (s: string) =>
    s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  // Get the parent page title from the base segment
  const getParentTitle = () => {
    if (isEducation) return 'Education'
    if (isProducts) return 'Products'
    if (isMeeting) return 'Meeting'
    if (isPastMeetings) return 'Past Meetings'
    return toTitle(segments[baseIndex] ?? '')
  }

  // Determine the actual page title to display
  const getPageTitle = () => {
    // If we have child segments, use the last one as the page title
    if (childSegments.length > 0) {
      return toTitle(childSegments[childSegments.length - 1])
    }
    // Otherwise use what was passed as children or the parent title
    return children || getParentTitle()
  }

  return (
    <Box
      sx={{
        paddingX: 3,
        borderBottom: '1px solid',
        borderColor: 'divider',
        paddingTop: 2,
        paddingBottom: 1,
      }}
    >
      {childSegments.length > 0 && (
        <Breadcrumbs
          aria-label="breadcrumb"
          sx={{
            'MuiBreadcrumbs-li': {
              display: 'flex',
              alignItems: 'center',
            },
          }}
        >
          <MuiLink
            component={Link}
            variant="body3"
            underline="hover"
            color="link"
            href={
              isEducation
                ? '/education'
                : isProducts
                  ? '/products'
                  : `${tickerPrefix}/${segments[baseIndex]}`
            }
          >
            {getParentTitle()}
          </MuiLink>
          {childSegments.map((seg, idx) => {
            const basePath = isEducation
              ? '/education'
              : isProducts
                ? '/products'
                : `${tickerPrefix}/${segments[baseIndex]}`
            const href = `${basePath}/${childSegments.slice(0, idx + 1).join('/')}`
            const isLast = idx === childSegments.length - 1
            const label = toTitle(seg)
            return isLast ? (
              <Typography
                component="span"
                key={href}
                variant="body3"
                sx={{ color: 'text.primary' }}
              >
                {label}
              </Typography>
            ) : (
              <MuiLink
                key={href}
                variant="body3"
                underline="hover"
                color="inherit"
                href={href}
              >
                {label}
              </MuiLink>
            )
          })}
        </Breadcrumbs>
      )}
      <Typography
        component="h1"
        variant="pageTitle"
        fontWeight={500}
        fontFamily={'var(--font-tungsten)'}
        gutterBottom
      >
        {getPageTitle()}
      </Typography>
    </Box>
  )
}
