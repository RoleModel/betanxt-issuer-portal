import { type ApiClientReturnType, buildApiClient } from '../apiClient'

export async function listClients(
  page?: number,
  limit?: number,
  ticker?: string
): Promise<
  ApiClientReturnType<{
    clients: any[]
    total: number
    page: number
    limit: number
  }>
> {
  try {
    const supabase = buildApiClient()
    const currentPage = page || 1
    const currentLimit = limit || 20
    const offset = (currentPage - 1) * currentLimit

    let query = supabase
      .from('client')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (ticker) {
      query = query.eq('ticker', ticker)
    }

    const {
      data: clients,
      error,
      count,
    } = await query.range(offset, offset + currentLimit - 1)

    if (error) {
      return {
        data: undefined,
        error: {
          message: error.message,
          statusCode: 500,
        },
      }
    }

    return {
      data: {
        clients: clients || [],
        total: count || 0,
        page: currentPage,
        limit: currentLimit,
      },
      error: undefined,
    }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch clients',
        statusCode: 500,
      },
    }
  }
}

export async function createClient(clientData: any): Promise<ApiClientReturnType<any>> {
  try {
    const supabase = buildApiClient()

    const { data: client, error } = await supabase
      .from('client')
      .insert([
        {
          ...clientData,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      return {
        data: undefined,
        error: {
          message: error.message,
          statusCode: error.code === '23505' ? 400 : 500,
        },
      }
    }

    return {
      data: client,
      error: undefined,
    }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to create client',
        statusCode: 500,
      },
    }
  }
}

export async function getClientByTicker(
  ticker: string
): Promise<ApiClientReturnType<any>> {
  try {
    const supabase = buildApiClient()

    const { data: client, error } = await supabase
      .from('client')
      .select('*')
      .eq('ticker', ticker)
      .single()

    if (error) {
      return {
        data: undefined,
        error: {
          message: error.message,
          statusCode: error.code === 'PGRST116' ? 404 : 500,
        },
      }
    }

    return {
      data: client,
      error: undefined,
    }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch client',
        statusCode: 500,
      },
    }
  }
}

export async function updateClient(
  ticker: string,
  clientData: any
): Promise<ApiClientReturnType<any>> {
  try {
    const supabase = buildApiClient()

    const { data: client, error } = await supabase
      .from('client')
      .update({
        ...clientData,
        updated_at: new Date().toISOString(),
      })
      .eq('ticker', ticker)
      .select()
      .single()

    if (error) {
      return {
        data: undefined,
        error: {
          message: error.message,
          statusCode: error.code === 'PGRST116' ? 404 : 500,
        },
      }
    }

    return {
      data: client,
      error: undefined,
    }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to update client',
        statusCode: 500,
      },
    }
  }
}

export async function deleteClient(ticker: string): Promise<ApiClientReturnType<void>> {
  try {
    const supabase = buildApiClient()

    const { error } = await supabase.from('client').delete().eq('ticker', ticker)

    if (error) {
      return {
        data: undefined,
        error: {
          message: error.message,
          statusCode: error.code === 'PGRST116' ? 404 : 500,
        },
      }
    }

    return {
      data: undefined,
      error: undefined,
    }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to delete client',
        statusCode: 500,
      },
    }
  }
}
