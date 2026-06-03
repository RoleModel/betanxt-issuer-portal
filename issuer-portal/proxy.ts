import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authBypassed =
    process.env.NEXT_PUBLIC_BYPASS_AUTH === "true" ||
    request.nextUrl.searchParams.get("bypass_auth") === "true";

  if (request.nextUrl.searchParams.get("bypass_auth") === "true") {
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete("bypass_auth");
    return NextResponse.redirect(cleanUrl);
  }

  // Allow login page, API routes, auth routes, and static assets through
  if (
    authBypassed ||
    pathname.includes("/login") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Server-side session cookie check to prevent unauthenticated flash
  const hasSession =
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token") ||
    request.cookies.has("next-auth.session-token") ||
    request.cookies.has("__Secure-next-auth.session-token");

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|fonts|logos|images).*)"],
};
