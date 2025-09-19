import { type ApiClientReturnType, buildApiClient } from '../apiClient'

export async function listAccounts(
  page?: number,
  limit?: number
): Promise<
  ApiClientReturnType<{
    accounts: any[]
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

    // First get accounts
    const {
      data: accounts,
      error: accountError,
      count,
    } = await supabase
      .from('account')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + currentLimit - 1)

    if (accountError) {
      return {
        data: undefined,
        error: {
          message: accountError.message,
          statusCode: 500,
        },
      }
    }

    // Then get client data for accounts that have client_id
    const clientIds =
      accounts?.filter((acc) => acc.client_id).map((acc) => acc.client_id) || []
    let clientsData: any[] = []

    if (clientIds.length > 0) {
      const { data: clients, error: clientError } = await supabase
        .from('client')
        .select('*')
        .in('id', clientIds)

      if (clientError) {
        return {
          data: undefined,
          error: {
            message: clientError.message,
            statusCode: 500,
          },
        }
      }
      clientsData = clients || []
    }

    // Join the data
    const accountsWithClients =
      accounts?.map((account) => ({
        ...account,
        client: account.client_id
          ? clientsData.find((c) => c.id === account.client_id)
          : null,
      })) || []

    return {
      data: {
        accounts: accountsWithClients,
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
        message: error instanceof Error ? error.message : 'Failed to fetch accounts',
        statusCode: 500,
      },
    }
  }
}

export async function createAccount(accountData: any): Promise<ApiClientReturnType<any>> {
  try {
    const supabase = buildApiClient()

    const { data: account, error } = await supabase
      .from('account')
      .insert([
        {
          ...accountData,
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
      data: account,
      error: undefined,
    }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to create account',
        statusCode: 500,
      },
    }
  }
}

export async function getAccountById(id: string): Promise<ApiClientReturnType<any>> {
  try {
    const supabase = buildApiClient()

    const { data: account, error } = await supabase
      .from('account')
      .select(
        `
        *,
        client:client_id (
          id,
          ticker,
          company_name,
          short_name
        )
      `
      )
      .eq('id', id)
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
      data: account,
      error: undefined,
    }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch account',
        statusCode: 500,
      },
    }
  }
}

export async function updateAccount(
  id: string,
  accountData: any
): Promise<ApiClientReturnType<any>> {
  try {
    const supabase = buildApiClient()

    const { data: account, error } = await supabase
      .from('account')
      .update(accountData)
      .eq('id', id)
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
      data: account,
      error: undefined,
    }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to update account',
        statusCode: 500,
      },
    }
  }
}

export async function deleteAccount(id: string): Promise<ApiClientReturnType<void>> {
  try {
    const supabase = buildApiClient()

    const { error } = await supabase.from('account').delete().eq('id', id)

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
        message: error instanceof Error ? error.message : 'Failed to delete account',
        statusCode: 500,
      },
    }
  }
}

export async function listUserAccounts(userId: string): Promise<
  ApiClientReturnType<{
    account: any[]
    total: number
  }>
> {
  try {
    const supabase = buildApiClient()

    // Get user to check their account_id and type
    const { data: user, error: userError } = await supabase
      .from('user')
      .select('account_id, type')
      .eq('id', userId)
      .single()

    if (userError) {
      return {
        data: undefined,
        error: {
          message: userError.message,
          statusCode: userError.code === 'PGRST116' ? 404 : 500,
        },
      }
    }

    let accounts: any[] = []

    if (user.type === 'RELATIONSHIP_MANAGER' || user.type === 'ADMIN') {
      // RM and Admin users can see all accounts
      const { data: allAccounts, error: accountsError } = await supabase
        .from('account')
        .select(
          `
          *,
          client:client_id (
            id,
            ticker,
            company_name,
            short_name
          )
        `
        )
        .order('created_at', { ascending: false })

      if (accountsError) {
        return {
          data: undefined,
          error: {
            message: accountsError.message,
            statusCode: 500,
          },
        }
      }

      accounts = allAccounts || []
    } else if (user.account_id) {
      // Regular users can only see their own account
      const { data: userAccount, error: accountError } = await supabase
        .from('account')
        .select(
          `
          *,
          client:client_id (
            id,
            ticker,
            company_name,
            short_name
          )
        `
        )
        .eq('id', user.account_id)
        .single()

      if (accountError) {
        return {
          data: undefined,
          error: {
            message: accountError.message,
            statusCode: 500,
          },
        }
      }

      accounts = [userAccount]
    }

    return {
      data: {
        account: accounts,
        total: accounts.length,
      },
      error: undefined,
    }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch user accounts',
        statusCode: 500,
      },
    }
  }
}
