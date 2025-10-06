import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

export default {
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET || 'development-secret-please-change-in-production',
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // Update session every hour instead of every request
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Check if auth bypass is enabled
        if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
          // Return a mock user for development
          return {
            id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            name: 'Dev User',
            email: 'dev@example.com',
            username: 'devuser',
            type: process.env.NEXT_PUBLIC_BYPASS_USER_ROLE?.toLowerCase() || 'admin',
            account_id: 'd607d704-0222-5a41-abd8-552ffa17c36c',
            client_ticker: null,
          }
        }

        if (!credentials?.username || !credentials?.password) {
          return null
        }

        // For development, allow these test users:
        const testUsers = [
          {
            id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            name: 'Dev User',
            email: 'dev@example.com',
            type: 'admin' as const,
            account_id: 'd607d704-0222-5a41-abd8-552ffa17c36c',
            client_ticker: null,
            username: 'devuser',
          },
          {
            id: 'e3e85881-afe0-52f7-9c33-a1d0f58836e7',
            username: 'mike.chen',
            name: 'Mike Chen',
            email: 'mike.chen@wendys.com',
            type: 'ADMIN',
            account_id: '02ddeb48-9faf-5caf-91ad-60e9d0ba928c',
            client_ticker: 'WEN',
          },
          {
            id: 'b1f5062a-09b6-5dc1-b18c-3800c5930eab',
            username: 'lisa.rodriguez',
            name: 'Lisa Rodriguez',
            email: 'lisa.rodriguez@paycom.com',
            type: 'ISSUER',
            account_id: 'cb08ea39-1128-5956-b828-9eaeb94b7892',
            client_ticker: 'PAYC',
          },
        ]

        const user = testUsers.find(
          (u) => u.username === credentials.username && credentials.password === 'password'
        )

        if (user) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            username: user.username,
            type: user.type,
            account_id: user.account_id,
            client_ticker: user.client_ticker,
          }
        }

        return null
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ request, auth }) {
      const { nextUrl } = request
      const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'

      if (bypassAuth) {
        return true
      }

      const isAuthenticated = !!auth?.user

      // Allow access to login page
      if (nextUrl.pathname.includes('/login')) {
        return true
      }

      // Require authentication for all other pages
      if (!isAuthenticated) {
        return false
      }

      // Check admin routes
      if (nextUrl.pathname.startsWith('/user')) {
        const roles = Array.isArray(auth?.user?.roles) ? auth.user.roles : []
        return roles.includes('ADMIN')
      }

      return true
    },
    async jwt({ token, user, trigger, session: updateData }) {
      if (user) {
        token.id = user.id
        token.type = user.type
        token.account_id = user.account_id
        token.client_ticker = user.client_ticker
        token.username = user.username
        token.roles = user.type === 'admin' || user.type === 'ADMIN' ? ['ADMIN', 'USER'] : ['USER']
      }

      // Handle session updates (like avatar uploads)
      if (trigger === 'update' && updateData) {
        if (updateData.image !== undefined) {
          token.image = updateData.image
        }
      }

      return token
    },
    async session({ session, token }) {
      session.user.id = (token.id as string | undefined) ?? token.sub ?? ''
      session.user.type = (token.type as string | undefined) ?? undefined
      session.user.account_id = (token.account_id as string | undefined) ?? undefined
      session.user.client_ticker = (token.client_ticker as string | null | undefined) ?? null
      session.user.username = (token.username as string | undefined) ?? undefined
      session.user.image = (token.image as string | null | undefined) ?? null
      session.user.roles = Array.isArray(token.roles) ? (token.roles as string[]) : []
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url === baseUrl) {
        return baseUrl
      }
      return url.startsWith(baseUrl) ? url : baseUrl
    },
  },
} satisfies NextAuthConfig
