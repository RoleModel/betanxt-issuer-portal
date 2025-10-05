import type { Session } from 'next-auth'

import { type Permission, allowedTo } from '@/authorization/permissions'

const defaultLandingPages = [
  { path: '/meeting', permissions: ['viewDashboard'] },
]

export class UserRoutes {
  constructor(private session: Session | null) { }

  get defaultLandingPage(): string {
    if (!this.session) {
      return '/login'
    }

    // Auth bypass mode is handled in the root page, not here

    // Find first accessible page for the user
    const accessiblePage = defaultLandingPages.find((page) => {
      if (page.permissions.length === 0) return true
      // For now, just return true - we can add proper permission checking later
      return true
    })

    return accessiblePage?.path || '/not-found'
  }

  async canAccess(pathname: string): Promise<boolean> {
    if (!this.session) {
      return false
    }

    // Define route permissions
    const routePermissions: Record<string, string[]> = {
      '/meeting': ['viewDashboard'],
      '/reporting': ['viewReports'],
      '/past-meeting': ['viewDashboard'],
      // Add more routes and their required permissions
    }

    // Define ticker-based route patterns that should be allowed
    const tickerRoutePatterns = [
      {
        pattern: /^\/[A-Z]{2,5}\/meeting(\/.*)?$/,
        permissions: ['viewMeeting'],
      }, // /[TICKER]/meeting/*
      { pattern: /^\/[A-Z]{2,5}\/meeting$/, permissions: ['viewMeeting'] }, // /[TICKER]/meeting
      {
        pattern: /^\/[A-Z]{2,5}\/reporting(\/.*)?$/,
        permissions: ['viewReports'],
      }, // /[TICKER]/reporting/*
    ]

    // Check if the route requires permissions (standard routes)
    const requiredPermissions = Object.entries(routePermissions).find(([route]) =>
      pathname.startsWith(route)
    )?.[1]

    // If no standard route match, check ticker-based route patterns
    let tickerPermissions: string[] | undefined
    if (!requiredPermissions) {
      const matchingTickerRoute = tickerRoutePatterns.find(({ pattern }) =>
        pattern.test(pathname)
      )
      tickerPermissions = matchingTickerRoute?.permissions
    }

    const permissions = requiredPermissions || tickerPermissions

    if (!permissions) {
      // No specific permissions required, allow access
      return true
    }

    // Check if user has all required permissions
    const permissionChecks = await Promise.all(
      permissions.map((permission) => allowedTo(permission as Permission))
    )
    return permissionChecks.every(Boolean)
  }
}

export default UserRoutes
