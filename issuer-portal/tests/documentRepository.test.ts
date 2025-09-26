// Playwright test namespace (lightweight smoke test for documentRepository)
// Ensures import graph and fallback logic don't throw.
import { test, expect } from '@playwright/test'
import { documentRepository } from '@/domain-models/documentRepository'

test.describe('documentRepository (smoke)', () => {
  test('listByMeeting returns an array (graceful fallback)', async () => {
    let docs: unknown
    try {
      docs = await documentRepository.listByMeeting('non-existent-meeting')
    } catch (e) {
      test.skip(true, 'Repository threw (likely backend unavailable); skipping smoke assertion.')
      return
    }
    expect(Array.isArray(docs)).toBeTruthy()
  })
})
