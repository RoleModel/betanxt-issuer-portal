import NextAuth from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import CredentialsProvider from 'next-auth/providers/credentials'

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  trustHost: true,
  secret:
    process.env.NEXTAUTH_SECRET ??
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
        // Auth bypass for development - return mock user with configured role
        if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
          const bypassRole = (process.env.NEXT_PUBLIC_BYPASS_USER_ROLE || 'ADMIN') as
            | 'ISSUER'
            | 'ADMIN'
            | 'PARENT_CLIENT'
            | 'SOLICITOR'
            | 'CSM'
          return {
            id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            username: 'dev.user',
            type: bypassRole,
            account_id: 'd607d704-0222-5a41-abd8-552ffa17c36c',
            client_ticker: null,
          }
        }

        if (!credentials?.username || !credentials?.password) {
          return null
        }

        // Mock authentication for development
        // Mock user data based on username
        const mockUsers: Record<
          string,
          {
            id: string
            username: string
            password: string
            type: 'ISSUER' | 'ADMIN' | 'PARENT_CLIENT' | 'SOLICITOR' | 'CSM'
            account_id?: string
            client_ticker?: string | null
          }
        > = {
          'dev.user': {
            id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            username: 'dev.user',
            password: 'ju$Ky8Ad1#%g',
            type: 'ADMIN',
            account_id: 'd607d704-0222-5a41-abd8-552ffa17c36c',
            client_ticker: null,
          },
          'test.user': {
            id: '7d170e7c-7d1f-5ae0-ac54-c987eb45b2a9',
            username: 'test.user',
            password: '9yUDDftg@Lh!',
            type: 'ADMIN',
            account_id: undefined,
            client_ticker: null,
          },
          mike: {
            id: 'b1f5062a-09b6-5dc1-b18c-3800c5930eab',
            username: 'mike',
            password: 'password',
            type: 'ISSUER',
            account_id: 'acc-wen-001',
            client_ticker: 'WEN',
          },
          lisa: {
            id: 'c2g6173b-10c7-6ed2-c29d-4911d6041fcb',
            username: 'lisa',
            password: 'password',
            type: 'ISSUER',
            account_id: 'acc-paycom-001',
            client_ticker: 'PAYC',
          },
          david: {
            id: 'd3h7284c-21d8-7fe3-d30e-5a22e7152gdc',
            username: 'david',
            password: 'password',
            type: 'ISSUER',
            account_id: 'acc-woodward-001',
            client_ticker: 'WWD',
          },
          jenny: {
            id: 'e4i8395d-32e9-8gf4-e41f-6b33f8263hed',
            username: 'jenny',
            password: 'password',
            type: 'ISSUER',
            account_id: 'acc-enliven-001',
            client_ticker: 'ELVN',
          },
          'dfin.admin': {
            id: 'f5a9406e-43fa-9hg5-f52g-7c44g9374ife',
            username: 'dfin.admin',
            password: 'DfinP@ss1',
            type: 'PARENT_CLIENT',
            account_id: undefined,
            client_ticker: null,
          },
          morrow: {
            id: 'g6b0517f-54gb-0ih6-g63h-8d55h0485jgf',
            username: 'morrow',
            password: 'MrwSdl@1',
            type: 'SOLICITOR',
            account_id: undefined,
            client_ticker: null,
          },
          'csm.user': {
            id: 'h7c1628g-65hc-1ji7-h74i-9e66i1596kgh',
            username: 'csm.user',
            password: 'CsmP@ss1',
            type: 'CSM',
            account_id: undefined,
            client_ticker: null,
          },
        }

        const user = mockUsers[credentials.username as string]

        if (user) {
          if (credentials.password === user.password) {
            return {
              id: user.id,
              username: user.username,
              type: user.type,
              account_id: user.account_id,
              client_ticker: user.client_ticker,
            }
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
      try {
        if (user) {
          // Type assertion for custom user properties
          const customUser = user as typeof user & {
            type?: string
            account_id?: string
            client_ticker?: string | null
            username?: string
          }
          token.id = customUser.id // Store the actual user ID
          token.type = customUser.type
          token.account_id = customUser.account_id
          token.client_ticker = customUser.client_ticker
          token.username = customUser.username
        }

        // In dev bypass mode, always sync role from env so switching roles
        // doesn't require clearing cookies
        if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
          token.type = process.env.NEXT_PUBLIC_BYPASS_USER_ROLE || 'ADMIN'
        }

        // Handle session updates (like avatar uploads)
        if (trigger === 'update' && updateData) {
          if (updateData.image !== undefined) {
            token.image = updateData.image
          }
        }

        return token
      } catch (_error) {
        return token
      }
    },
    // NextAuth.js requires callbacks to be async even if they don't use await
    // eslint-disable-next-line @typescript-eslint/require-await
    async session({ session, token }) {
      const t = token as JWT & {
        sub?: string
        id?: string
        image?: string
        type?: string
        account_id?: string
        client_ticker?: string | null
        username?: string
        name?: string
        email?: string
      }
      // Type assertion for custom session user properties
      const user = session.user as typeof session.user & {
        type?: string
        account_id?: string
        client_ticker?: string | null
        username?: string
      }
      user.id = t.id ?? t.sub ?? '' // Use the stored user ID, fallback to sub
      user.type = t.type ?? undefined
      user.account_id = t.account_id ?? undefined
      user.client_ticker = t.client_ticker ?? null
      user.username = t.username ?? undefined
      user.image = t.image ?? null // Include the image field
      // Populate name and email for profile page - use token values or fallback to username
      user.name = t.name ?? t.username ?? session.user.name ?? 'User'
      user.email = t.email ?? session.user.email ?? `${t.username ?? 'user'}@example.com`
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
