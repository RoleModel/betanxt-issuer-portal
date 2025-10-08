import NextLink from 'next/link'
import type { LinkProps as NextLinkProps } from 'next/link'
import * as React from 'react'

/**
 * LinkBehavior - A properly typed Next.js Link wrapper for MUI components
 *
 * This component bridges Next.js Link with MUI components that expect a LinkComponent.
 * It properly forwards refs to avoid "Illegal invocation" errors in MUI v7+ with React 19.
 *
 * Usage:
 * 1. With MUI Tab:
 *    <Tab label="Home" href="/home" LinkComponent={LinkBehavior} />
 *
 * 2. With MUI Link:
 *    <Link component={LinkBehavior} href="/about">About</Link>
 *
 * 3. In theme configuration:
 *    MuiLink: { defaultProps: { component: LinkBehavior } }
 */

export interface LinkBehaviorProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: NextLinkProps['href']
  prefetch?: NextLinkProps['prefetch']
  replace?: NextLinkProps['replace']
  scroll?: NextLinkProps['scroll']
  shallow?: NextLinkProps['shallow']
  locale?: NextLinkProps['locale']
}

const LinkBehavior = React.forwardRef<HTMLAnchorElement, LinkBehaviorProps>(
  function LinkBehavior(props, ref) {
    const {
      href,
      prefetch = false,
      replace,
      scroll,
      shallow,
      locale,
      ...other
    } = props

    return (
      <NextLink
        href={href}
        prefetch={prefetch}
        replace={replace}
        scroll={scroll}
        shallow={shallow}
        locale={locale}
        ref={ref}
        {...other}
      />
    )
  }
)

export default LinkBehavior
