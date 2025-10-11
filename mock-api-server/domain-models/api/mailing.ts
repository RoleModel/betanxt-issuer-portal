import type { components } from '@/types/api'
import { supabase } from '@/utils/supabase/client'
import type { Database } from '@/utils/supabase/database.types'

// Use generated types from OpenAPI schema
type Mailing = components['schemas']['Mailing']
type MailingRow = Database['public']['Tables']['mailing']['Row']

// Helper type for backend responses
interface ApiResponse<T> {
  data?: T
  error?: {
    message: string
    statusCode?: number
  }
}

// Helper function to convert null to undefined
function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value
}

// Transform snake_case database fields to camelCase API fields
function transformMailing(dbMailing: MailingRow): Mailing {
  return {
    id: nullToUndefined(dbMailing.id),
    meetingId: nullToUndefined(dbMailing.meeting_id),
    ticker: nullToUndefined(dbMailing.ticker),
    totalAccounts: nullToUndefined(dbMailing.total_accounts),
    totalPositions: nullToUndefined(dbMailing.total_positions),
    totalRetransmissions: nullToUndefined(dbMailing.total_retransmissions),
    totalRollups: nullToUndefined(dbMailing.total_rollups),
    fullsetMailPositions: nullToUndefined(dbMailing.fullset_mail_positions),
    naaMailPositions: nullToUndefined(dbMailing.naa_mail_positions),
    courtesyOtherMailPositions: nullToUndefined(dbMailing.courtesy_other_mail_positions),
    electronicSuppressedPositions: nullToUndefined(
      dbMailing.electronic_suppressed_positions
    ),
    householdSuppressedPositions: nullToUndefined(
      dbMailing.household_suppressed_positions
    ),
    managedSuppressedPositions: nullToUndefined(dbMailing.managed_suppressed_positions),
    consolidatedSuppressedPositions: nullToUndefined(
      dbMailing.consolidated_suppressed_positions
    ),
    canceledSuppressedPositions: nullToUndefined(dbMailing.canceled_suppressed_positions),
    createdAt: nullToUndefined(dbMailing.created_at),
    updatedAt: nullToUndefined(dbMailing.updated_at),
  }
}

export async function getMailingByMeetingId(
  meetingId: string
): Promise<ApiResponse<Mailing>> {
  try {
    const { data, error } = await supabase
      .from('mailing')
      .select('*')
      .eq('meeting_id', meetingId)
      .maybeSingle()

    if (error) {
      return {
        error: { message: error.message ?? 'Failed to fetch mailing data' },
      }
    }

    if (!data) {
      return {
        error: { message: 'Mailing data not found', statusCode: 404 },
      }
    }

    return {
      data: transformMailing(data),
    }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch mailing data',
      },
    }
  }
}
