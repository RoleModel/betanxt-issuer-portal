// Ticker-namespaced meeting API functions
export async function listTickerMeetings(
  ticker: string,
  params?: {
    accountId?: string
    status?: 'ACTIVE' | 'COMPLETE' | 'ADJOURNED'
    meetingYear?: number
    page?: number
    limit?: number
  }
) {
  try {
    const queryParams = new URLSearchParams()
    // Add ticker as a filter instead of in the path
    queryParams.set('ticker', ticker)
    if (params?.accountId) queryParams.set('accountId', params.accountId)
    if (params?.status) queryParams.set('status', params.status)
    if (params?.meetingYear) queryParams.set('meetingYear', params.meetingYear.toString())
    if (params?.page) queryParams.set('page', params.page.toString())
    if (params?.limit) queryParams.set('limit', params.limit.toString())

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'
    const response = await fetch(`${baseUrl}/meetings?${queryParams}`)

    if (!response.ok) {
      const errorData = await response.json()
      return { data: null, error: errorData }
    }

    const data = await response.json()
    return { data, error: null }
  } catch (error) {
    return { data: null, error: { message: 'Failed to fetch meetings' } }
  }
}

export async function getTickerMeetingById(ticker: string, id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'
    // Use the standard meetings endpoint
    const response = await fetch(`${baseUrl}/meetings/${id}`)

    if (!response.ok) {
      const errorData = await response.json()
      return { data: null, error: errorData }
    }

    const data = await response.json()
    return { data, error: null }
  } catch (error) {
    return { data: null, error: { message: 'Failed to fetch meeting' } }
  }
}

export async function createTickerMeeting(ticker: string, meeting: any) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'
    // Add ticker to meeting data instead of in path
    const meetingWithTicker = { ...meeting, ticker }
    const response = await fetch(`${baseUrl}/meetings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(meetingWithTicker),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { data: null, error: errorData }
    }

    const data = await response.json()
    return { data, error: null }
  } catch (error) {
    return { data: null, error: { message: 'Failed to create meeting' } }
  }
}

export async function updateTickerMeeting(ticker: string, id: string, updates: any) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'
    // Use the standard meetings endpoint
    const response = await fetch(`${baseUrl}/meetings/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { data: null, error: errorData }
    }

    const data = await response.json()
    return { data, error: null }
  } catch (error) {
    return { data: null, error: { message: 'Failed to update meeting' } }
  }
}

export async function deleteTickerMeeting(ticker: string, id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'
    // Use the standard meetings endpoint
    const response = await fetch(`${baseUrl}/meetings/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { data: null, error: errorData }
    }

    return { data: null, error: null }
  } catch (error) {
    return { data: null, error: { message: 'Failed to delete meeting' } }
  }
}
