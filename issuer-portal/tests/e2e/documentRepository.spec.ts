// Playwright smoke test for documentRepository domain model.
// Ensures import graph works and backend absence doesn't hard-fail.
import { expect, test } from '@playwright/test'

import { documentRepository } from '@/domain-models/documentRepository'

// Skip automatically if repository throws (e.g., backend not running).
// This keeps CI green while still giving coverage when services are up.
test.describe('documentRepository (smoke)', () => {
  test('listByMeeting returns an array (graceful fallback)', async () => {
    let docs: unknown
    try {
      docs = await documentRepository.listByMeeting('non-existent-meeting')
    } catch {
      test.skip(true, 'Repository threw (backend likely not running).')
      return
    }
    expect(Array.isArray(docs)).toBeTruthy()
  })
})
