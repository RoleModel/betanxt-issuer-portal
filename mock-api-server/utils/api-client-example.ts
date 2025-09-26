/**
 * Example usage of the new openapi-fetch API client
 * This file demonstrates how to use the type-safe openapi-fetch client
 */
import { apiClient } from '@/domain-models/apiClient'

// Example: Authentication flow using openapi-fetch
export const exampleAuthFlow = async () => {
  try {
    // Login
    const { data: loginData, error: loginError } = await apiClient.POST('/auth/login', {
      body: {
        username: 'john.doe',
        password: 'password123',
      },
    })

    if (loginError) {
      return
    }

    // Get current user
    const { data: currentUser, error: userError } = await apiClient.GET('/auth/me')
    if (userError) {
      return
    }

    // Logout
    const { error: logoutError } = await apiClient.POST('/auth/logout')
    if (logoutError) {
      return
    }
  } catch (error) {}
}

// Example: User management using openapi-fetch
export const exampleUserManagement = async () => {
  try {
    // List users with pagination
    const { data: usersData, error: usersError } = await apiClient.GET('/users', {
      params: {
        query: {
          page: 1,
          limit: 10,
        },
      },
    })

    if (usersError) {
      return
    }

    // Create a new user
    const { data: newUser, error: createError } = await apiClient.POST('/users', {
      body: {
        username: 'newuser',
        firstName: 'New',
        lastName: 'User',
        email: 'newuser@example.com',
        password: 'securepassword',
        type: 'ISSUER',
        accountId: 'account-uuid-here',
      },
    })

    if (createError) {
      return
    }

    if (newUser?.id) {
      // Update the user
      const { data: updatedUser, error: updateError } = await apiClient.PUT(
        '/users/{id}',
        {
          params: {
            path: { id: newUser.id },
          },
          body: {
            firstName: 'Updated',
            lastName: 'Name',
          },
        }
      )

      if (updateError) {
        return
      }
    }
  } catch (error) {}
}

// Example: Meeting management using openapi-fetch
export const exampleMeetingManagement = async () => {
  try {
    // List meetings with filters
    const { data: meetingsData, error: meetingsError } = await apiClient.GET(
      '/meetings',
      {
        params: {
          query: {
            page: 1,
            limit: 20,
            status: 'ACTIVE',
            clientId: 'client-uuid-here',
            meetingYear: 2024,
          },
        },
      }
    )

    if (meetingsError) {
      return
    }

    // Create a new meeting
    const { data: newMeeting, error: createError } = await apiClient.POST('/meetings', {
      body: {
        id: 'meeting-2024-001',
        title: 'Annual Shareholder Meeting 2024',
        cusip: '12345678',
        ticker: 'ACME',
        recordDate: '2024-05-01',
        mailingDate: '2024-05-15',
        meetingDate: '2024-06-15',
        meetingType: 'Annual',
        meetingYear: 2024,
        distributionType: 'Electronic',
        transferAgent: 'Transfer Agent Corp',
        totalSharesOutstanding: '1000000',
        quorumRequirement: 50.0,
        clientId: 'client-uuid-here',
      },
    })

    if (createError) {
      return
    }

    if (newMeeting?.id) {
      // Update meeting status
      const { data: updatedMeeting, error: updateError } = await apiClient.PUT(
        '/meetings/{meetingId}',
        {
          params: {
            path: { meetingId: newMeeting.id },
          },
          body: {
            status: 'ACTIVE',
            currentPhase: 'Voting',
            overallCompletion: 75,
          },
        }
      )

      if (updateError) {
        return
      }
    }
  } catch (error) {}
}

// Example: Account management
export const exampleAccountManagement = async () => {
  try {
    // List all accounts
    const accountsResult = await apiClient.GET('/accounts', {
      params: { query: { page: 1, limit: 10 } },
    })

    if (accountsResult.data) {
    }

    // Create a new account
    const newAccountResult = await apiClient.POST('/accounts', {
      body: {
        name: 'ACME Corporation',
        primaryContact: 'John Doe',
        clientId: 'client-uuid-here',
      },
    })

    if (newAccountResult.data) {
    }
  } catch (error) {}
}

// Example: Custom API call using the raw client
export const exampleCustomApiCall = async () => {
  try {
    // You can also use the raw client for custom endpoints or advanced usage
    const { data, error } = await apiClient.GET('/users/{id}', {
      params: {
        path: { id: 'user-uuid-here' },
      },
    })

    if (error) {
      return
    }
  } catch (error) {}
}

// Example: Error handling patterns with openapi-fetch
export const exampleErrorHandling = async () => {
  try {
    const { data, error, response } = await apiClient.GET('/users/{id}', {
      params: {
        path: { id: 'non-existent-id' },
      },
    })

    if (error) {
      // Handle different error types using the response status
      switch (response.status) {
        case 404:
          break
        case 401:
          break
        case 403:
          break
        default:
      }
    } else {
    }
  } catch (error) {}
}

// MIGRATION GUIDE: Converting from old custom API client to openapi-fetch
//
// OLD WAY (custom API client):
// const result = await apiClient.getMeetingById('WEN-2024-AGM')
// if (result.error) { /* handle error */ }
//
// NEW WAY (openapi-fetch):
// const { data, error } = await apiClient.GET('/meetings/{meetingId}', {
//   params: { path: { meetingId: 'WEN-2024-AGM' } }
// })
// if (error) { /* handle error */ }
//
// Key differences:
// 1. Method names: getMeetingById() -> GET('/meetings/{meetingId}', ...)
// 2. Parameters: (id) -> { params: { path: { meetingId: id } } }
// 3. Query params: (query) -> { params: { query: {...} } }
// 4. Request body: (body) -> { body: {...} }
// 5. Response structure: Same { data, error } pattern
//
// Benefits of openapi-fetch:
// - Full TypeScript type safety based on OpenAPI schema
// - Automatic inference of request/response types
// - Zero runtime overhead - types are compile-time only
// - Better IntelliSense and autocomplete
// - Industry-standard approach using openapi-fetch
// - Direct mapping to OpenAPI paths and operations
