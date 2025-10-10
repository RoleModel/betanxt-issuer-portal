import createClient from 'openapi-fetch'
import type { FetchResponse } from 'openapi-fetch'

import type { paths } from '../types/api'

// Create the base API client
export const apiClient = createClient<paths>({
  baseUrl: process.env.API_BASE_URL ?? 'http://localhost:3000/api',
})

// Authentication token management
let authToken: string | null = null

export const setAuthToken = (token: string | null): void => {
  authToken = token
}

export const getAuthToken = (): string | null => authToken

// Convenience methods for common operations
export const auth = {
  async login(
    username: string,
    password: string
  ): Promise<FetchResponse<paths['/auth/login']['post']>> {
    const result = await apiClient.POST('/auth/login', {
      body: { username, password },
    })

    if (result.data?.token) {
      setAuthToken(result.data.token)
    }

    return result
  },

  async logout(): Promise<FetchResponse<paths['/auth/logout']['post']>> {
    const result = await apiClient.POST('/auth/logout')
    setAuthToken(null)
    return result
  },

  async getCurrentUser(): Promise<FetchResponse<paths['/auth/me']['get']>> {
    return await apiClient.GET('/auth/me')
  },
}

export const users = {
  async list(params?: {
    page?: number
    limit?: number
    role?: string
  }): Promise<FetchResponse<paths['/users']['get']>> {
    return await apiClient.GET('/users', {
      params: { query: params },
    })
  },

  async create(userData: {
    username: string
    firstName: string
    lastName: string
    email: string
    password: string
    type: 'ADMIN' | 'ISSUER' | 'RELATIONSHIP_MANAGER'
    accountId?: string
  }): Promise<FetchResponse<paths['/users']['post']>> {
    return await apiClient.POST('/users', {
      body: userData,
    })
  },

  async getById(id: string): Promise<FetchResponse<paths['/users/{id}']['get']>> {
    return await apiClient.GET('/users/{id}', {
      params: { path: { id } },
    })
  },

  async update(
    id: string,
    userData: {
      firstName?: string
      lastName?: string
      email?: string
      type?: 'ADMIN' | 'ISSUER' | 'RELATIONSHIP_MANAGER'
      accountId?: string
    }
  ): Promise<FetchResponse<paths['/users/{id}']['put']>> {
    return await apiClient.PUT('/users/{id}', {
      params: { path: { id } },
      body: userData,
    })
  },

  async delete(id: string): Promise<FetchResponse<paths['/users/{id}']['delete']>> {
    return await apiClient.DELETE('/users/{id}', {
      params: { path: { id } },
    })
  },
}

export const meetings = {
  async list(params?: {
    page?: number
    limit?: number
    status?: 'ACTIVE' | 'ADJOURNED' | 'COMPLETE'
    clientId?: string
    meetingYear?: number
    cusip?: string
    ticker?: string
  }): Promise<FetchResponse<paths['/meetings']['get']>> {
    return await apiClient.GET('/meetings', {
      params: { query: params },
    })
  },

  async create(meetingData: {
    id: string
    title: string
    cusip: string
    ticker: string
    recordDate: string
    mailingDate: string
    meetingDate: string
    meetingType: string
    meetingYear: number
    distributionType: string
    transferAgent: string
    totalSharesOutstanding: string
    quorumRequirement: number
    clientId: string
    employeeStockPlans?: string
    planAdministrator?: string
    planAdministratorContact?: string
    planAdministratorContactEmail?: string
    solicitor?: string
    solicitorEmail?: string
  }): Promise<FetchResponse<paths['/meetings']['post']>> {
    return await apiClient.POST('/meetings', {
      body: meetingData,
    })
  },

  async getById(
    id: string
  ): Promise<FetchResponse<paths['/meetings/{meetingId}']['get']>> {
    return await apiClient.GET('/meetings/{meetingId}', {
      params: { path: { meetingId: id } },
    })
  },

  async update(
    id: string,
    meetingData: {
      title?: string
      recordDate?: string
      mailingDate?: string
      meetingDate?: string
      meetingType?: string
      status?: 'ACTIVE' | 'ADJOURNED' | 'COMPLETE'
      currentPhase?: string
      overallCompletion?: number
      distributionType?: string
      transferAgent?: string
      employeeStockPlans?: string
      planAdministrator?: string
      planAdministratorContact?: string
      planAdministratorContactEmail?: string
      solicitor?: string
      solicitorEmail?: string
      documentHostingSiteLabel?: string
      documentHostingSiteUrl?: string
      eVoteSiteLabel?: string
      eVoteSiteUrl?: string
      ivrDialInNumber?: string
      totalSharesOutstanding?: string
      quorumRequirement?: number
    }
  ): Promise<FetchResponse<paths['/meetings/{meetingId}']['put']>> {
    return await apiClient.PUT('/meetings/{meetingId}', {
      params: { path: { meetingId: id } },
      body: meetingData,
    })
  },

  async delete(
    id: string
  ): Promise<FetchResponse<paths['/meetings/{meetingId}']['delete']>> {
    return await apiClient.DELETE('/meetings/{meetingId}', {
      params: { path: { meetingId: id } },
    })
  },
}

// Add more API methods as needed for accounts, phases, tasks, documents, etc.

// Export the main client for custom usage
export default apiClient
