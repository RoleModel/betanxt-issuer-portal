import { redirect } from 'next/navigation'

import UserRoutes from '@/domain-models/UserRoutes'

import { auth } from '@/authentication/auth-config'

interface WithAuthOptions {
  requiredPermissions?: string[]
  fallbackPath?: string
}

// Higher-order component that mimics mic-ops withRouteGuard pattern for App Router
export function withAuth<T extends {}>(
  Component: React.ComponentType<T>,
  options: WithAuthOptions = {}
) {
  return async function AuthenticatedComponent(props: T) {
    const session = await auth()
    const userRoutes = new UserRoutes(session)

    if (!session) {
      redirect('/login')
    }

    // Check permissions if required
    if (options.requiredPermissions?.length) {
      const hasPermissions = options.requiredPermissions.every((permission) => {
        // This would check against user roles/permissions
        // For now, we'll assume all authenticated users have access
        return true
      })

      if (!hasPermissions) {
        const fallback = options.fallbackPath || userRoutes.defaultLandingPage
        redirect(`${fallback}?messageCode=access-denied`)
      }
    }

    return <Component {...props} />
  }
}

export default withAuth
