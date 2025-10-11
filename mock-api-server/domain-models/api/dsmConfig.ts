import { randomUUID } from 'crypto'

import type { components } from '@/types/api'
import { supabase } from '@/utils/supabase/client'
import type { Database } from '@/utils/supabase/database.types'

// Helper function to convert null to undefined
function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value
}

// Use generated types from OpenAPI schema
type DSMConfig = components['schemas']['DSMConfig']
type DSMConfigRow = Database['public']['Tables']['dsm_config']['Row']
type DSMConfigInsert = Database['public']['Tables']['dsm_config']['Insert']

// Helper type for backend responses
interface ApiResponse<T> {
  data?: T
  error?: {
    message: string
    statusCode?: number
  }
}

// Transform snake_case database fields to camelCase API fields
export function transformDSMConfig(dbConfig: DSMConfigRow): DSMConfig {
  return {
    id: dbConfig.id,
    meetingId: dbConfig.meeting_id,
    liveQa: dbConfig.live_qa || false,
    audioOnly: dbConfig.audio_only || false,
    meetingRecording: dbConfig.meeting_recording || false,
    staticSlideDocId: nullToUndefined(dbConfig.static_slide_doc_id),
    displayDocsDocId: nullToUndefined(dbConfig.display_docs_doc_id),
    isConfirmed: dbConfig.is_confirmed || false,
    logisticsCallDate: nullToUndefined(dbConfig.logistics_call_date),
    logisticsCallNotes: nullToUndefined(dbConfig.logistics_call_notes),
    logisticsCallScheduled: dbConfig.logistics_call_scheduled || false,
    dryRunDate: nullToUndefined(dbConfig.dry_run_date),
    dryRunNotes: nullToUndefined(dbConfig.dry_run_notes),
    dryRunScheduled: dbConfig.dry_run_scheduled || false,
    dsmEnabled: dbConfig.dsm_enabled ?? true,
    ioeEnabled: dbConfig.ioe_enabled ?? true,
    dsmProducerName: nullToUndefined(dbConfig.dsm_producer_name),
    dsmProducerEmail: nullToUndefined(dbConfig.dsm_producer_email),
    inspectorName: nullToUndefined(dbConfig.inspector_name),
    inspectorEmail: nullToUndefined(dbConfig.inspector_email),
    speakerListDocId: nullToUndefined(dbConfig.speaker_list_doc_id),
    guestLinkRegistrationDocId: nullToUndefined(dbConfig.guest_link_registration_doc_id),
    createdAt: nullToUndefined(dbConfig.created_at),
    updatedAt: nullToUndefined(dbConfig.updated_at),
  }
}

// Transform camelCase API fields to snake_case database fields
export function transformToDSMConfigInsert(
  config: Partial<DSMConfig>,
  meetingId: string
): DSMConfigInsert {
  return {
    id: config.id || randomUUID(),
    meeting_id: meetingId,
    live_qa: config.liveQa,
    audio_only: config.audioOnly,
    meeting_recording: config.meetingRecording,
    static_slide_doc_id: config.staticSlideDocId,
    display_docs_doc_id: config.displayDocsDocId,
    is_confirmed: config.isConfirmed,
    logistics_call_date: config.logisticsCallDate,
    logistics_call_notes: config.logisticsCallNotes,
    logistics_call_scheduled: config.logisticsCallScheduled,
    dry_run_date: config.dryRunDate,
    dry_run_notes: config.dryRunNotes,
    dry_run_scheduled: config.dryRunScheduled,
    dsm_enabled: config.dsmEnabled,
    ioe_enabled: config.ioeEnabled,
    dsm_producer_name: config.dsmProducerName,
    dsm_producer_email: config.dsmProducerEmail,
    inspector_name: config.inspectorName,
    inspector_email: config.inspectorEmail,
    speaker_list_doc_id: config.speakerListDocId,
    guest_link_registration_doc_id: config.guestLinkRegistrationDocId,
  }
}

export async function getDSMConfig(meetingId: string): Promise<ApiResponse<DSMConfig>> {
  try {
    const { data, error } = await supabase
      .from('dsm_config')
      .select('*')
      .eq('meeting_id', meetingId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      return {
        error: { message: error.message ?? 'Failed to fetch DSM config' },
      }
    }

    if (!data) {
      // Return default config if none exists
      return {
        data: {
          meetingId,
          liveQa: false,
          audioOnly: false,
          meetingRecording: false,
          isConfirmed: false,
        } as DSMConfig,
      }
    }

    return {
      data: transformDSMConfig(data),
    }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch DSM config',
      },
    }
  }
}

export async function createOrUpdateDSMConfig(
  meetingId: string,
  config: Partial<DSMConfig>
): Promise<ApiResponse<DSMConfig>> {
  try {
    const dbRecord = transformToDSMConfigInsert(config, meetingId)

    const { data, error } = await supabase
      .from('dsm_config')
      .upsert(dbRecord, {
        onConflict: 'meeting_id',
      })
      .select()
      .single()

    if (error) {
      return {
        error: { message: error.message ?? 'Failed to save DSM config' },
      }
    }

    return {
      data: transformDSMConfig(data),
    }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to save DSM config',
      },
    }
  }
}

export async function updateDSMConfig(
  meetingId: string,
  config: Partial<DSMConfig>
): Promise<ApiResponse<DSMConfig>> {
  try {
    const dbRecord = transformToDSMConfigInsert(config, meetingId)

    const { data, error } = await supabase
      .from('dsm_config')
      .update(dbRecord)
      .eq('meeting_id', meetingId)
      .select()
      .single()

    if (error) {
      return {
        error: { message: error.message ?? 'Failed to update DSM config' },
      }
    }

    return {
      data: transformDSMConfig(data),
    }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to update DSM config',
      },
    }
  }
}
