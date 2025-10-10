import NextAuth from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import Credentials from 'next-auth/providers/credentials'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET || 'development-secret-please-change-in-production',
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
            type: process.env.NEXT_PUBLIC_BYPASS_USER_ROLE?.toUpperCase() || 'ADMIN',
            account_id: 'd607d704-0222-5a41-abd8-552ffa17c36c', // Wendy's account ID
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
            type: 'ADMIN' as const,
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
          (u) =>
            u.username === credentials.username && credentials.password === 'password'
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
    async jwt({ token, user, trigger, session: updateData }) {
      if (user) {
        token.id = user.id // Store the actual user ID
        token.type = user.type
        token.account_id = user.account_id
        token.client_ticker = user.client_ticker
        token.username = user.username
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
      const t = token as JWT & { sub?: string; id?: string; image?: string }
      session.user.id = t.id ?? t.sub ?? '' // Use the stored user ID, fallback to sub
      session.user.type = t.type ?? undefined
      session.user.account_id = t.account_id ?? undefined
      session.user.client_ticker = t.client_ticker ?? null
      session.user.username = t.username ?? undefined
      session.user.image = t.image ?? null // Include the image field
      return session
    },
    async redirect({ url, baseUrl }) {
      // Let the app handle dynamic client routing
      if (url === baseUrl) {
        return baseUrl
      }
      return url.startsWith(baseUrl) ? url : baseUrl
    },
  },
})
