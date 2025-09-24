import NextAuth, { type NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

export const config = {
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
            id: process.env.NEXT_PUBLIC_BYPASS_USER_ID || 'dev-user-123',
            name: 'Dev User',
            email: 'dev@example.com',
            username: 'devuser',
            type: process.env.NEXT_PUBLIC_BYPASS_USER_ROLE?.toLowerCase() || 'admin',
            accountId: 'd607d704-0222-5a41-abd8-552ffa17c36c', // Wendy's account ID
            client: null,
            roles: ['ADMIN', 'USER'], // Default roles for dev bypass
          }
        }

        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          // Call mock-api-server for authentication
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

          const user = await response.json()

          if (user) {
            return {
              id: user.id,
              name: `${user.firstName} ${user.lastName}`,
              email: user.email,
              username: user.username,
              type: user.type,
              accountId: user.accountId,
              client: user.client || { id: 1, name: 'Default Client' },
              roles: user.roles || [],
            }
          }
        } catch (error) {}

        return null
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username
        token.type = user.type
        token.accountId = user.accountId
        token.client = user.client
        token.roles = user.roles
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub || ''
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
