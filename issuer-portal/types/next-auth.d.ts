import NextAuth from 'next-auth'

type Client = {
  id: number
  name: string
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      username?: string
      type?: string
      accountId?: string
      client?: Client | null
      roles?: string[]
    }
  }

  interface User {
    id?: string
    username?: string
    type?: string
    accountId?: string
    client?: Client | null
    roles?: string[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    username?: string
    type?: string
    accountId?: string
    client?: Client | null
    roles?: string[]
  }
}
