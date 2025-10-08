import * as React from 'react'
import { Link as MuiLink } from '@mui/material'
import type { LinkProps as MuiLinkProps } from '@mui/material'
import LinkBehavior from '@/components/LinkBehavior'

/**
 * BNLink - A custom Link component that wraps MUI Link with LinkBehavior
 *
 * This component automatically uses LinkBehavior to properly handle Next.js routing
 * and avoid "Illegal invocation" errors in MUI v7+ with React 19.
 *
 * Usage:
 *   <BNLink href="/about">About</BNLink>
 */

interface BNLinkProps extends Omit<MuiLinkProps, 'component'> {
  href: string
}

const BNLink = React.forwardRef<HTMLAnchorElement, BNLinkProps>(
  function BNLink(props, ref) {
    return (
      <MuiLink
        component={LinkBehavior}
        ref={ref}
        {...props}
      />
    )
  }
)

export default BNLink
