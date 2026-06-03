import { redirect } from "next/navigation";

import { auth } from "@/auth";
import UserRoutes from "@/domain-models/UserRoutes";

interface WithAuthOptions {
  requiredPermissions?: string[];
  fallbackPath?: string;
}

// Higher-order component that mimics mic-ops withRouteGuard pattern for App Router
export function withAuth<T extends object>(
  Component: React.ComponentType<T>,
  options: WithAuthOptions = {},
) {
  return async function AuthenticatedComponent(props: T) {
    const session = await auth();

    if (!session) {
      redirect("/login");
    }

    // Check permissions if required
    if (options.requiredPermissions?.length) {
      const hasPermissions = options.requiredPermissions.every(() => {
        // This would check against user roles/permissions
        // For now, we'll assume all authenticated users have access
        return true;
      });

      if (!hasPermissions) {
        const userRoutes = new UserRoutes(session);
        const fallback = options.fallbackPath || userRoutes.defaultLandingPage;
        redirect(`${fallback}?messageCode=access-denied`);
      }
    }

    return <Component {...props} />;
  };
}

export default withAuth;
