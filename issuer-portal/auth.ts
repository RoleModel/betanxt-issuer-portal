import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import type { JWT } from 'next-auth/jwt'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET ??
    'fallback-secret-for-development-only-change-in-production',

  // Configure caching to reduce API calls
  useSecureCookies: process.env.NODE_ENV === 'production',

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        // Mock authentication for development
        // Mock user data based on username
        const mockUsers = {
            mike: {
              id: 'b1f5062a-09b6-5dc1-b18c-3800c5930eab',
              username: 'mike',
              type: 'ISSUER' as const,
              account_id: 'acc-wen-001',
              client_ticker: 'WEN',
            },
            lisa: {
              id: 'c2g6173b-10c7-6ed2-c29d-4911d6041fcb',
              username: 'lisa',
              type: 'ISSUER' as const,
              account_id: 'acc-paycom-001',
              client_ticker: 'PAYC',
            },
            david: {
              id: 'd3h7284c-21d8-7fe3-d30e-5a22e7152gdc',
              username: 'david',
              type: 'ISSUER' as const,
              account_id: 'acc-woodward-001',
              client_ticker: 'WWD',
            },
            jenny: {
              id: 'e4i8395d-32e9-8gf4-e41f-6b33f8263hed',
              username: 'jenny',
              type: 'ISSUER' as const,
              account_id: 'acc-enliven-001',
              client_ticker: 'ELVN',
            },
          }

        const user = mockUsers[credentials.username as keyof typeof mockUsers]
        if (user && credentials.password === 'password') {
          return {
            id: user.id,
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours - session will be updated every 24 hours
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    // NextAuth.js requires callbacks to be async even if they don't use await
    // eslint-disable-next-line @typescript-eslint/require-await
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
    // NextAuth.js requires callbacks to be async even if they don't use await
    // eslint-disable-next-line @typescript-eslint/require-await
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
    // NextAuth.js requires callbacks to be async even if they don't use await
    // eslint-disable-next-line @typescript-eslint/require-await
    async redirect({ url, baseUrl }) {
      // Let the app handle dynamic client routing
      if (url === baseUrl) {
        return baseUrl
      }
      return url.startsWith(baseUrl) ? url : baseUrl
    },
  },
})
