import { type ApiClientReturnType, buildApiClient } from '../apiClient'

export async function listUsers(
  accountId?: string,
  type?: string
): Promise<ApiClientReturnType<any[]>> {
  try {
    const supabase = buildApiClient()
    let query = supabase.from('user').select('*')

    if (accountId) {
      query = query.eq('account_id', accountId)
    }
    if (type) {
      query = query.eq('type', type)
    }

    query = query.order('created_at', { ascending: false })

    const { data: users, error } = await query
    if (error) {
      return {
        data: undefined,
        error: { message: error.message, statusCode: 500 },
      }
    }
    return { data: users || [], error: undefined }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch users',
        statusCode: 500,
      },
    }
  }
}

export async function createUser(body: any): Promise<ApiClientReturnType<any>> {
  try {
    const supabase = buildApiClient()
    const { data: user, error } = await supabase
      .from('user')
      .insert([{ ...body, created_at: new Date().toISOString() }])
      .select()
      .single()
    if (error) {
      return {
        data: undefined,
        error: { message: error.message, statusCode: 500 },
      }
    }
    return { data: user, error: undefined }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to create user',
        statusCode: 500,
      },
    }
  }
}

export async function getUserById(id: string): Promise<ApiClientReturnType<any>> {
  try {
    const supabase = buildApiClient()
    const { data: user, error } = await supabase
      .from('user')
      .select('*')
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
    return { data: user, error: undefined }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch user',
        statusCode: 500,
      },
    }
  }
}

export async function updateUser(
  id: string,
  body: any
): Promise<ApiClientReturnType<any>> {
  try {
    const supabase = buildApiClient()
    const { data: user, error } = await supabase
      .from('user')
      .update({ ...body, updated_at: new Date().toISOString() })
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
    return { data: user, error: undefined }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to update user',
        statusCode: 500,
      },
    }
  }
}

export async function deleteUser(id: string): Promise<ApiClientReturnType<void>> {
  try {
    const supabase = buildApiClient()
    const { error } = await supabase.from('user').delete().eq('id', id)
    if (error) {
      return {
        data: undefined,
        error: { message: error.message, statusCode: 500 },
      }
    }
    return { data: undefined, error: undefined }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to delete user',
        statusCode: 500,
      },
    }
  }
}

export async function listAccountUsers(
  accountId: string
): Promise<ApiClientReturnType<any[]>> {
  try {
    const supabase = buildApiClient()
    const { data: users, error } = await supabase
      .from('user')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
    if (error) {
      return {
        data: undefined,
        error: { message: error.message, statusCode: 500 },
      }
    }
    return { data: users || [], error: undefined }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch users',
        statusCode: 500,
      },
    }
  }
}

export async function listUserAccounts(
  userId: string
): Promise<ApiClientReturnType<{ account: any[]; total: number }>> {
  try {
    const supabase = buildApiClient()
    const { data: user, error: userError } = await supabase
      .from('user')
      .select('id, account_id, type')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return {
        data: undefined,
        error: {
          message: userError?.message || 'User not found',
          statusCode: 404,
        },
      }
    }

    let accounts: any[] = []
    let count = 0

    if (user.type === 'ADMIN' || user.type === 'RELATIONSHIP_MANAGER') {
      // Admins and RMs can see all accounts
      const {
        data: allAccounts,
        error: allAccountsError,
        count: allAccountsCount,
      } = await supabase
        .from('account')
        .select('*, client(id, ticker, company_name, short_name)', {
          count: 'exact',
        })
        .order('created_at', { ascending: false })

      if (allAccountsError) {
        return {
          data: undefined,
          error: { message: allAccountsError.message, statusCode: 500 },
        }
      }
      accounts = allAccounts || []
      count = allAccountsCount || 0
    } else if (user.account_id) {
      // Issuer users can only see their own account
      const {
        data: singleAccount,
        error: singleAccountError,
        count: singleAccountCount,
      } = await supabase
        .from('account')
        .select('*, client(id, ticker, company_name, short_name)', {
          count: 'exact',
        })
        .eq('id', user.account_id)
        .single()

      if (singleAccountError) {
        return {
          data: undefined,
          error: { message: singleAccountError.message, statusCode: 500 },
        }
      }
      accounts = singleAccount ? [singleAccount] : []
      count = singleAccountCount || 0
    }

    return { data: { account: accounts, total: count }, error: undefined }
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
