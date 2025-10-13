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
