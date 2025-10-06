import { useCallback, useEffect, useState } from 'react'

import { useClient } from '@/contexts/ClientContext'
import { useMeeting } from '@/contexts/MeetingContext'

export interface HostingSiteStatus {
  id?: string
  meeting_id: string
  client_id?: string
  status: 'Incomplete' | 'Pending Review' | 'Revision Requested' | 'Approved'
  site_url?: string | null
  test_control_number?: string
  approved_by?: string | null
  approved_at?: string | null
  created_at?: string
  updated_at?: string
  hosting_site_revisions?: Record<string, unknown>[]
  hosting_site_comments?: Record<string, unknown>[]
}

export interface RevisionRequest {
  revision_request: string
  requested_by?: string
  client_id?: string
}

export interface Comment {
  comment: string
  user_id?: string
  user_name?: string
  client_id?: string
}

export function useHostingSiteStatus() {
  const { currentMeeting } = useMeeting()
  const { currentClient } = useClient()
  const [hostingSiteStatus, setHostingSiteStatus] = useState<HostingSiteStatus | null>(
    null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch hosting site status
  const fetchHostingSiteStatus = useCallback(async () => {
    if (!currentMeeting?.id) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/hosting-site/${currentMeeting.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch hosting site status')
      }
      const data = await response.json()
      setHostingSiteStatus(data)
    } catch (err) {
      console.error('Error fetching hosting site status:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      // Set default status if fetch fails
      setHostingSiteStatus({
        meeting_id: currentMeeting.id,
        status: 'Incomplete',
        test_control_number: '123456782',
      })
    } finally {
      setLoading(false)
    }
  }, [currentMeeting?.id])

  // Update hosting site status
  const updateHostingSiteStatus = useCallback(
    async (
      status: HostingSiteStatus['status'],
      additionalData?: Partial<HostingSiteStatus>
    ) => {
      if (!currentMeeting?.id) return

      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/hosting-site/${currentMeeting.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status,
            client_id: currentClient?.id,
            site_url: additionalData?.site_url,
            approved_by: additionalData?.approved_by,
            approved_at:
              additionalData?.approved_at ||
              (status === 'Approved' ? new Date().toISOString() : null),
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to update hosting site status')
        }

        const data = await response.json()
        setHostingSiteStatus(data)
        return data
      } catch (err) {
        console.error('Error updating hosting site status:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
        throw err
      } finally {
        setLoading(false)
      }
    },
    [currentMeeting?.id, currentClient?.id]
  )

  // Submit revision request
  const submitRevisionRequest = useCallback(
    async (revisionRequest: string) => {
      if (!currentMeeting?.id) return

      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/hosting-site/${currentMeeting.id}/revisions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            revision_request: revisionRequest,
            client_id: currentClient?.id,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to submit revision request')
        }

        // Update local status to "Revision Requested"
        await updateHostingSiteStatus('Revision Requested')

        // Refresh the full hosting site status to get the new revision
        await fetchHostingSiteStatus()
      } catch (err) {
        console.error('Error submitting revision request:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
        throw err
      } finally {
        setLoading(false)
      }
    },
    [
      currentMeeting?.id,
      currentClient?.id,
      updateHostingSiteStatus,
      fetchHostingSiteStatus,
    ]
  )

  // Add comment
  const addComment = useCallback(
    async (comment: string) => {
      if (!currentMeeting?.id) return

      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/hosting-site/${currentMeeting.id}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            comment,
            client_id: currentClient?.id,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to add comment')
        }

        // Refresh the full hosting site status to get the new comment
        await fetchHostingSiteStatus()
      } catch (err) {
        console.error('Error adding comment:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
        throw err
      } finally {
        setLoading(false)
      }
    },
    [currentMeeting?.id, currentClient?.id, fetchHostingSiteStatus]
  )

  // Approve hosting site
  const approveHostingSite = useCallback(
    async (approvedBy?: string) => {
      return updateHostingSiteStatus('Approved', {
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
      })
    },
    [updateHostingSiteStatus]
  )

  // Load hosting site status on mount and when meeting changes
  useEffect(() => {
    fetchHostingSiteStatus()
  }, [fetchHostingSiteStatus])

  return {
    hostingSiteStatus,
    loading,
    error,
    updateHostingSiteStatus,
    submitRevisionRequest,
    addComment,
    approveHostingSite,
    refreshHostingSiteStatus: fetchHostingSiteStatus,
  }
}
