import { auth } from "@/auth";

type Permission =
  | "viewMeeting"
  | "manageMeetings"
  | "viewReports"
  | "manageUsers"
  | "viewTabulation"
  | "manageTabulation";

async function allowedTo(permission: Permission): Promise<boolean> {
  const session = await auth();

  if (!session) {
    return false;
  }

  const { roles, type } = session.user;

  // Admin has all permissions
  if (roles?.includes("ADMIN") || type === "ADMIN" || type === "admin") {
    return true;
  }

  // PARENT_CLIENT, SOLICITOR, and CSM have read access to meetings, reports, and tabulation
  if (type === "PARENT_CLIENT" || type === "SOLICITOR" || type === "CSM") {
    return (
      permission === "viewMeeting" ||
      permission === "viewReports" ||
      permission === "viewTabulation"
    );
  }

  // Map permissions to roles
  switch (permission) {
    case "viewMeeting":
      return roles?.includes("ISSUER") || false;
    case "manageMeetings":
      return roles?.includes("ISSUER") || roles?.includes("USER") || false;

    case "viewReports":
      return roles?.includes("ISSUER") || false;

    case "viewTabulation":
      return roles?.includes("ISSUER") || roles?.includes("VIEWER") || false;

    case "manageTabulation":
      return roles?.includes("ISSUER") || roles?.includes("ISSUER") || false;

    default:
      return false;
  }
}

async function notAllowedTo(permission: Permission): Promise<boolean> {
  return !(await allowedTo(permission));
}

// Get current user's client information
async function getCurrentClient() {
  const session = await auth();
  return session?.user?.client || null;
}

// Get current user's roles
async function getCurrentRoles() {
  const session = await auth();
  return session?.user?.roles || [];
}

export { allowedTo, notAllowedTo, getCurrentClient, getCurrentRoles };
export type { Permission };
