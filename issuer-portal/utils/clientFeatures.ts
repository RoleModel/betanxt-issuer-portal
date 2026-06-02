import type { ClientFeatureKey } from '@/hooks/useClients'

export type { ClientFeatureKey }

export const FEATURE_KEYS: Record<ClientFeatureKey, ClientFeatureKey> = {
  documents: 'documents',
  mailing: 'mailing',
  tabulation: 'tabulation',
  reports: 'reports',
  fileTransfer: 'fileTransfer',
  agenda: 'agenda',
}

export const FEATURE_LABELS: Record<ClientFeatureKey, string> = {
  documents: 'Documents',
  mailing: 'Mailing',
  tabulation: 'Tabulation',
  reports: 'Reports',
  fileTransfer: 'File Transfer',
  agenda: 'Agenda',
}
