import { auth } from '@/auth'

export default auth((req) => {
  // req.auth contains the session
  // Middleware will handle authentication based on auth.config.ts
})

// Match all routes except static files, API routes, and public assets
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
