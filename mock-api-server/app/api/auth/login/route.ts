// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-09-17T01:20:22.507Z
// Source: openapi-schema/openapi.yaml

import { NextRequest, NextResponse } from 'next/server'
// import { supabase } from '@/utils/supabase/client'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = (await request.json()) as { username?: string; password?: string }
    const { username, password } = body

    // Mock authentication - in real app, verify against database
    if (username && password) {
      // Mock user data
      const user = {
        id: '1',
        username,
        email: `${username}@example.com`,
        firstName: 'John',
        lastName: 'Doe',
        type: 'user',
        accountId: 'acc_1'
      }

      return NextResponse.json(user, { status: 200 })
    } else {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Error in POST /auth/login:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'loginUser'
      },
      { status: 500 }
    )
  }
}

