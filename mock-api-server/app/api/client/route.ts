// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-09-17T01:00:47.522Z
// Source: openapi-schema/openapi.yaml
import { NextRequest, NextResponse } from 'next/server'

import type { components } from '@/types/api'

// import { supabase } from '@/utils/supabase/client'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Fetch from Supabase directly using REST API
    const supabaseUrl = 'http://localhost:54321/rest/v1/client'
    const supabaseKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

    const response = await fetch(
      `${supabaseUrl}?select=*&is_active=eq.true&order=company_name`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.statusText}`)
    }

    const dbClients = (await response.json()) as Array<{
      id: string
      ticker: string
      company_name: string
      short_name: string
      industry?: string
      description?: string
      website?: string
      primary_contact?: string
      primary_contact_email?: string
      is_active: boolean
      created_at?: string
      updated_at?: string
    }>

    // Transform to API format
    const clients = dbClients.map((client) => ({
      id: client.id,
      ticker: client.ticker,
      companyName: client.company_name,
      shortName: client.short_name,
      industry: client.industry,
      description: client.description,
      website: client.website,
      primaryContact: client.primary_contact,
      primaryContactEmail: client.primary_contact_email,
      isActive: client.is_active,
      createdAt: client.created_at,
      updatedAt: client.updated_at,
    }))

    return NextResponse.json({
      clients,
      pagination: {
        page,
        limit,
        total: clients.length,
        totalPages: Math.ceil(clients.length / limit),
      },
    })
  } catch (error) {
    console.error('Error in GET /client:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'listClients',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body = (await request.json()) as components['schemas']['CreateClientRequest']

    // TODO: Implement createClient
    // Operation: createClient
    // This route was auto-generated from OpenAPI spec

    // Example: Insert data into Supabase
    // const { data, error } = await supabase
    //   .from('table_name')
    //   .insert(body)
    //   .select()

    return NextResponse.json(
      {
        message: 'Route /client POST not yet implemented',
        operationId: 'createClient',
        method: 'POST',
        path: '/client',
        body,
      },
      { status: 501 }
    ) // 501 Not Implemented
  } catch (error) {
    console.error('Error in POST /client:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'createClient',
      },
      { status: 500 }
    )
  }
}
