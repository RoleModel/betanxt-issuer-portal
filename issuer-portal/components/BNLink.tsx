import * as React from 'react'
import Link from 'next/link'
import type { LinkProps as NextLinkProps } from 'next/link'
import { styled } from '@mui/material/styles'

/**
 * BNLink - A custom Link component that uses Next.js Link with MUI styling
 *
 * This component bypasses MUI Link entirely to avoid ref forwarding issues
 * in MUI v7+ with React 19. Instead, it applies MUI Link styles directly to
 * the anchor tag within Next.js Link.
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
  sx?: any
}

const StyledAnchor = styled('a', {
  shouldForwardProp: (prop) =>
    prop !== 'underline' && prop !== 'color'
})<{ underline?: 'none' | 'hover' | 'always'; color?: string }>(({ theme, underline = 'hover', color = 'primary' }) => ({
  ...theme.typography.body3,
  color: color === 'primary' ? theme.palette.primary.main : color,
  fontWeight: 500,
  textDecoration: underline === 'always' ? 'underline' : 'none',
  cursor: 'pointer',
  '&:hover': {
    textDecoration: underline === 'hover' || underline === 'always' ? 'underline' : 'none',
    color: color === 'primary' ? theme.palette.primary.dark : color,
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
      children,
      ...other
    } = props

    return (
      <Link
        href={href}
        prefetch={prefetch}
        replace={replace}
        scroll={scroll}
        passHref
        legacyBehavior
      >
        <StyledAnchor
          underline={underline}
          color={color}
          sx={sx}
          ref={ref}
          {...other}
        >
          {children}
        </StyledAnchor>
      </Link>
    )
  }
)

export default BNLink
