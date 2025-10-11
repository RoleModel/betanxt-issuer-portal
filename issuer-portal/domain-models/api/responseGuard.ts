// Simple runtime narrowing helper for API responses
export interface ApiEnvelope<T> {
  data?: T
  error?: unknown
}

export function assertOk<T>(res: ApiEnvelope<T>, message?: string): T {
  if (typeof res !== 'object' || res === null) {
    throw new Error(message ?? 'Malformed API response')
  }
  if (res.error !== undefined || res.data === undefined) {
    throw new Error(message ?? 'API response error')
  }
  return res.data
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
