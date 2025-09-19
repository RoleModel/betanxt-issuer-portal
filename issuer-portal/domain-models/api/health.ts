import buildApiClient from '@/domain-models/apiClient'

export async function checkHealth() {
  try {
    const response = await fetch('http://localhost:3001/api/health')
    return await response.json()
  } catch (error) {
    throw new Error('Mock API server is not running')
  }
}
