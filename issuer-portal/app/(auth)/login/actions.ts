'use server'

import { AuthError } from 'next-auth'

import { signIn } from '@/auth'

export async function authenticate(
  username: string,
  password: string,
) {
  try {
    await signIn('credentials', {
      username,
      password,
      redirectTo: '/',
    })
  } catch (error) {
    // NextAuth throws NEXT_REDIRECT when signIn succeeds and redirects
    // We need to re-throw it so Next.js can handle the redirect
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }

    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Invalid credentials' }
        default:
          return { error: 'Something went wrong' }
      }
    }
    throw error
  }
}
