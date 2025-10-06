import { handlers } from '@/authentication/auth-config'

// Export only the HTTP handlers for the API route
export const { GET, POST } = handlers
