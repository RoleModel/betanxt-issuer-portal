'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

import { buildApiClient } from '@/domain-models/apiClient'

import type { components } from '@/types/api'

type DbNotification = components['schemas']['Notification']

// Helper to extract error message from API errors
const getApiErrorMessage = (err: unknown, fallback: string): string => {
  if (!err) return fallback
  if (typeof err === 'string') return err
  if (typeof err === 'object' && 'message' in err) {
    const message = (err as { message?: unknown }).message
    if (typeof message === 'string' && message.trim().length > 0) {
      return message
    }
  }
  return fallback
}

interface NotificationContextType {
  notifications: DbNotification[]
  unreadCount: number
  loading: boolean
  error: string | null
  fetchNotifications: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: React.ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<DbNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const apiClient = await buildApiClient()
      const { data, error } = await apiClient.GET('/notifications')

      if (error || !data) {
        setError(getApiErrorMessage(error, 'Failed to fetch notifications'))
        setNotifications([])
        return
      }

      setNotifications(data as DbNotification[])
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications')
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        const apiClient = await buildApiClient()
        await apiClient.PATCH('/notifications/{notificationId}/mark-read', {
          params: { path: { notificationId } },
        })

        // Update local state optimistically
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        )
      } catch (err) {
        console.error('Failed to mark notification as read:', err)
        // Refetch to ensure consistency
        await fetchNotifications()
      }
    },
    [fetchNotifications]
  )

  const markAllAsRead = useCallback(async () => {
    try {
      const apiClient = await buildApiClient()
      const unreadNotifications = notifications.filter((n) => !n.read && n.id)

      // Mark all unread notifications as read
      await Promise.all(
        unreadNotifications.map((n) => {
          // We've already filtered for notifications with ids above
          const notificationId = n.id!
          return apiClient.PATCH('/notifications/{notificationId}/mark-read', {
            params: { path: { notificationId } },
          })
        })
      )

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
      // Refetch to ensure consistency
      await fetchNotifications()
    }
  }, [notifications, fetchNotifications])

  // Initial fetch
  useEffect(() => {
    void fetchNotifications()

    // Refetch notifications every 60 seconds
    const interval = setInterval(() => {
      void fetchNotifications()
    }, 60000)

    return () => clearInterval(interval)
  }, [fetchNotifications])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
