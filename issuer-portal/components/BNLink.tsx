'use client'

import * as React from 'react'
import Link from 'next/link'
import type { LinkProps as NextLinkProps } from 'next/link'
import { styled } from '@mui/material/styles'

/**
 * BNLink - A custom Link component that uses Next.js Link with MUI styling
 *
 * This component bypasses MUI Link entirely to avoid ref forwarding issues
 * in MUI v7+ with React 19. For Next.js 15 App Router, Link renders as an
 * <a> tag by default, so we can style it directly.
 *
 * Usage:
 *   <BNLink href="/about">About</BNLink>
 */

interface BNLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: NextLinkProps['href']
  prefetch?: NextLinkProps['prefetch']
  replace?: NextLinkProps['replace']
  scroll?: NextLinkProps['scroll']
  underline?: 'none' | 'hover' | 'always'
  color?: string
  sx?: Record<string, unknown>
}

// Style Next.js Link directly (it renders as <a> in App Router)
const StyledLink = styled(Link, {
  shouldForwardProp: (prop) =>
    prop !== 'underline' && prop !== 'color'
})<BNLinkProps>(({ theme, underline = 'hover', color = 'primary' }) => ({
  ...theme.typography.body3,
  color: color === 'primary' ? theme.vars.palette.link : color,
  fontWeight: 500,
  textDecoration: underline === 'always' ? 'underline' : 'none',
  cursor: 'pointer',
  '&:hover': {
    textDecoration: underline === 'hover' || underline === 'always' ? 'underline' : 'none',
  },
}))

const BNLink = React.forwardRef<HTMLAnchorElement, BNLinkProps>(
  function BNLink(props, ref) {
    const {
      href,
      prefetch = false,
      replace,
      scroll,
      underline = 'hover',
      color = 'primary',
      sx,
      ...other
    } = props

    return (
      <StyledLink
        href={href}
        prefetch={prefetch}
        replace={replace}
        scroll={scroll}
        underline={underline}
        color={color}
        sx={sx}
        ref={ref}
        {...other}
      />
    )
  }
)

export default BNLink
