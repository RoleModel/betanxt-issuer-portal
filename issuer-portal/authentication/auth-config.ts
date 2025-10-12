import NextAuth, { type NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

export const config = {
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET ?? 'development-secret-please-change-in-production',
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('🔐 AUTHORIZE CALLED - credentials:', JSON.stringify(credentials))
        console.log('🔐 BYPASS AUTH:', process.env.NEXT_PUBLIC_BYPASS_AUTH)

        // TEMPORARY: Always return a user to test if auth flow works
        return {
          id: '7d170e7c-7d1f-5ae0-ac54-c987eb45b2a9',
          name: 'Test User',
          email: 'test@betanxt.com',
          username: credentials?.username || 'test.user',
          type: 'admin',
          accountId: undefined,
          client: null,
          roles: ['ADMIN', 'USER'],
        }

        // Check if auth bypass is enabled
        if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
          console.log('🔐 Using bypass auth mode')
          // Return a mock user for development
          return {
            id: process.env.NEXT_PUBLIC_BYPASS_USER_ID ?? 'dev-user-123',
            name: 'Dev User',
            email: 'dev@example.com',
            username: 'devuser',
            type: process.env.NEXT_PUBLIC_BYPASS_USER_ROLE?.toLowerCase() ?? 'admin',
            accountId: 'd607d704-0222-5a41-abd8-552ffa17c36c', // Wendy's account ID
            client: null,
            roles: ['ADMIN', 'USER'], // Default roles for dev bypass
          }
        }

        if (!credentials?.username || !credentials?.password) {
          return null
        }

        // For development, allow these test users directly without calling API
        const testUsers = [
          {
            id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            name: 'Dev User',
            email: 'dev@example.com',
            username: 'dev.user',
            password: 'ju$Ky8Ad1#%g',
            type: 'admin',
            accountId: 'd607d704-0222-5a41-abd8-552ffa17c36c',
            client: null,
            roles: ['ADMIN', 'USER'],
          },
          {
            id: '7d170e7c-7d1f-5ae0-ac54-c987eb45b2a9',
            name: 'Test User',
            email: 'test@betanxt.com',
            username: 'test.user',
            password: '9yUDDftg@Lh!',
            type: 'admin',
            accountId: undefined,
            client: null,
            roles: ['ADMIN', 'USER'],
          },
          {
            id: 'e3e85881-afe0-52f7-9c33-a1d0f58836e7',
            username: 'mike.chen',
            name: 'Mike Chen',
            email: 'mike.chen@wendys.com',
            password: 'password',
            type: 'ADMIN',
            accountId: '02ddeb48-9faf-5caf-91ad-60e9d0ba928c',
            client: null,
            roles: ['ADMIN', 'USER'],
          },
        ]

        console.log('🔐 Attempting login with:', {
          username: credentials.username,
          providedPassword: credentials.password,
          bypassAuth: process.env.NEXT_PUBLIC_BYPASS_AUTH
        })

        const user = testUsers.find(
          (u) =>
            u.username === credentials.username && u.password === credentials.password
        )

        console.log('🔐 User found:', user ? 'YES' : 'NO')

        if (user) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            username: user.username,
            type: user.type,
            accountId: user.accountId || undefined,
            client: user.client,
            roles: user.roles,
          }
        }

        // If no direct match, try calling the API as fallback
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                username: credentials.username,
                password: credentials.password,
              }),
            }
          )

          if (!response.ok) {
            return null
          }

          const user = (await response.json()) as {
            id: string
            firstName: string
            lastName: string
            email: string
            username: string
            type: string
            accountId: string
            client?: { id: number; name: string } | null
            roles?: string[]
          }

          if (user) {
            return {
              id: user.id,
              name: `${user.firstName} ${user.lastName}`,
              email: user.email,
              username: user.username,
              type: user.type,
              accountId: user.accountId,
              client: user.client ?? { id: 1, name: 'Default Client' },
              roles: user.roles ?? [],
            }
          }
        } catch (error) {
          console.error('🔐 API auth failed:', error)
        }

        console.log('🔐 RETURNING NULL - auth failed')
        return null
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.username = user.username
        token.type = user.type
        token.accountId = user.accountId
        token.client = user.client
        token.roles = user.roles
      }
      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.sub ?? ''
        session.user.username =
          typeof token.username === 'string' ? token.username : undefined
        session.user.type = typeof token.type === 'string' ? token.type : undefined
        session.user.accountId =
          typeof token.accountId === 'string' ? token.accountId : undefined
        session.user.client =
          token.client &&
          typeof token.client === 'object' &&
          'id' in token.client &&
          'name' in token.client &&
          typeof token.client.id === 'number' &&
          typeof token.client.name === 'string'
            ? { id: token.client.id, name: token.client.name }
            : null
        session.user.roles = Array.isArray(token.roles) ? token.roles : []
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(config)
