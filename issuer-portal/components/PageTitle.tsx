import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Box, Breadcrumbs, Typography } from '@mui/material'
import { Link as MuiLink } from '@mui/material'

export function PageTitle({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const segments = pathname.replace(/^\/+|\/+$/g, '').split('/')

  // Check if we're under a client ticker path
  const hasClientTicker = segments.length > 0 && /^[A-Z]{2,5}$/.test(segments[0])
  const baseIndex = hasClientTicker ? 1 : 0
  const tickerPrefix = hasClientTicker ? `/${segments[0]}` : ''

  const isEducation = segments[baseIndex] === 'education'
  const isProducts = segments[baseIndex] === 'products'
  const childSegments = (isEducation || isProducts) ? segments.slice(baseIndex + 1) : []

  const toTitle = (s: string) =>
    s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
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
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
          <MuiLink
            component={Link}
            variant="body3"
            underline="hover"
            color="link"
            href={isEducation ? `${tickerPrefix}/education` : `${tickerPrefix}/products`}
          >
            Education
          </MuiLink>
          {childSegments.map((seg, idx) => {
            const href = `${tickerPrefix}/${isEducation ? 'education' : 'products'}/${childSegments.slice(0, idx + 1).join('/')}`
            const isLast = idx === childSegments.length - 1
            const label = toTitle(seg)
            return isLast ? (
              <Typography key={href} variant="body3" sx={{ color: 'text.primary' }}>
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
      <Typography component="h1" variant="pageTitle">
        {children}
      </Typography>
    </Box>
  )
}
