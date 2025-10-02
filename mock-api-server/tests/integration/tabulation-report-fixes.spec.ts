import { expect, test } from '@playwright/test'

const API_BASE_URL = 'http://localhost:3001'

interface ShareRange {
  rangeLabel: string
  positionCount: number
  totalShares: number
  percentVoted: number
}

test.describe('Tabulation Report Data Fix Validation', () => {
  /**
   * This test suite specifically validates that our fixes work:
   * 1. 2025 meetings are now Phase 8 (historical) with real voting data
   * 2. Data is no longer all zeros
   * 3. CSV position data is being used correctly
   */

  test("CRITICAL: 2025 Wendy's meeting no longer returns all zeros", async ({
    request,
  }) => {
    const response = await request.get(
      `${API_BASE_URL}/api/meetings/wen-annual-meeting-2025/tabulation-report`
    )

    expect(response.status()).toBe(200)
    const data = await response.json()

    // BEFORE THE FIX: These were all 0
    // AFTER THE FIX: These should have real values

    console.warn("🔍 Validating 2025 Wendy's tabulation data...")
    console.warn(
      `Total positions: ${data.positionsVoted.voted + data.positionsVoted.unvoted}`
    )
    console.warn(`Voted positions: ${data.positionsVoted.voted}`)
    console.warn(`Total shares: ${data.positionsVoted.totalShares}`)
    console.warn(`Voted shares: ${data.positionsVoted.votedShares}`)

    // Critical assertions - these should NOT be zero anymore
    expect(
      data.positionsVoted.totalShares,
      'Total shares should not be zero'
    ).toBeGreaterThan(0)
    expect(
      data.positionsVoted.voted + data.positionsVoted.unvoted,
      'Should have positions'
    ).toBeGreaterThan(0)

    // Should have substantial data from CSV (Wendy's has ~17,950 positions)
    expect(data.positionsVoted.voted + data.positionsVoted.unvoted).toBeGreaterThan(15000)
    expect(data.positionsVoted.totalShares).toBeGreaterThan(100000000) // Large company

    // Should have some voting activity (not 100% unvoted)
    expect(data.positionsVoted.voted, 'Should have some voted positions').toBeGreaterThan(
      0
    )
    expect(
      data.positionsVoted.votedShares,
      'Should have some voted shares'
    ).toBeGreaterThan(0)

    // Share ranges should have real data
    expect(data.shareRangePerformance.length, 'Should have share ranges').toBeGreaterThan(
      0
    )
    const totalRangeShares = data.shareRangePerformance.reduce(
      (sum: number, range: ShareRange) => sum + range.totalShares,
      0
    )
    expect(
      totalRangeShares,
      'Share ranges should have substantial totals'
    ).toBeGreaterThan(0)

    // Vote status should show real channel distribution
    const totalVotedByChannel =
      data.nonDtcVoteStatus.printShares +
      data.nonDtcVoteStatus.webShares +
      data.nonDtcVoteStatus.ivrShares
    if (data.nonDtcVoteStatus.votedSubtotalShares > 0) {
      expect(
        totalVotedByChannel,
        'Should have votes distributed across channels'
      ).toBeGreaterThan(0)
    }
  })

  test('VALIDATION: Compare 2025 vs 2026 - should show clear difference', async ({
    request,
  }) => {
    // Get 2025 data (should have votes)
    const response2025 = await request.get(
      `${API_BASE_URL}/api/meetings/wen-annual-meeting-2025/tabulation-report`
    )
    const data2025 = await response2025.json()

    // Get 2026 data (should have no votes)
    const response2026 = await request.get(
      `${API_BASE_URL}/api/meetings/wen-annual-meeting-2026/tabulation-report`
    )
    const data2026 = await response2026.json()

    console.warn('🔄 Comparing 2025 vs 2026 data...')
    console.warn(`2025 voted positions: ${data2025.positionsVoted.voted}`)
    console.warn(`2026 voted positions: ${data2026.positionsVoted.voted}`)
    console.warn(`2025 voted shares: ${data2025.positionsVoted.votedShares}`)
    console.warn(`2026 voted shares: ${data2026.positionsVoted.votedShares}`)

    // 2025 should have votes (historical), 2026 should not (future)
    expect(
      data2025.positionsVoted.voted,
      '2025 should have voted positions'
    ).toBeGreaterThan(0)
    expect(data2026.positionsVoted.voted, '2026 should have no voted positions').toBe(0)

    expect(
      data2025.positionsVoted.votedShares,
      '2025 should have voted shares'
    ).toBeGreaterThan(0)
    expect(data2026.positionsVoted.votedShares, '2026 should have no voted shares').toBe(
      0
    )

    // Both should have total shares (positions exist)
    expect(
      data2025.positionsVoted.totalShares,
      '2025 should have total shares'
    ).toBeGreaterThan(0)
    expect(
      data2026.positionsVoted.totalShares,
      '2026 should have total shares'
    ).toBeGreaterThan(0)
  })

  test('REGRESSION: Ensure CSV data loading is working', async ({ request }) => {
    // Test all companies that should have CSV data
    const companies = [
      { id: 'wen-annual-meeting-2025', name: "Wendy's", expectedPositions: 15000 },
      { id: 'payc-annual-meeting-2025', name: 'Paycom', expectedPositions: 3000 },
      { id: 'wwd-annual-meeting-2025', name: 'Woodward', expectedPositions: 3000 },
      { id: 'elvn-annual-meeting-2025', name: 'Enliven', expectedPositions: 15 },
    ]

    for (const company of companies) {
      const response = await request.get(
        `${API_BASE_URL}/api/meetings/${company.id}/tabulation-report`
      )
      expect(response.status()).toBe(200)

      const data = await response.json()
      const totalPositions = data.positionsVoted.voted + data.positionsVoted.unvoted

      console.warn(`📊 ${company.name}: ${totalPositions} positions`)

      expect(
        totalPositions,
        `${company.name} should have substantial positions from CSV`
      ).toBeGreaterThan(company.expectedPositions)
      expect(
        data.positionsVoted.totalShares,
        `${company.name} should have real share totals`
      ).toBeGreaterThan(0)

      // Should have set keys from CSV
      expect(data.setKeys.length, `${company.name} should have set keys`).toBeGreaterThan(
        0
      )
    }
  })

  test('EDGE CASE: Mixed voting status validation', async ({ request }) => {
    const response = await request.get(
      `${API_BASE_URL}/api/meetings/wen-annual-meeting-2025/tabulation-report`
    )
    const data = await response.json()

    // Should have both voted and unvoted positions (realistic scenario)
    expect(data.positionsVoted.voted, 'Should have some voted positions').toBeGreaterThan(
      0
    )
    expect(
      data.positionsVoted.unvoted,
      'Should have some unvoted positions'
    ).toBeGreaterThan(0)

    // Voted shares should be less than total shares (not 100% participation)
    expect(data.positionsVoted.votedShares).toBeLessThan(data.positionsVoted.totalShares)
    expect(data.positionsVoted.votedShares).toBeGreaterThan(0)

    // Should have realistic participation rate
    const participationRate =
      (data.positionsVoted.votedShares / data.positionsVoted.totalShares) * 100
    console.warn(`📈 Participation rate: ${participationRate.toFixed(2)}%`)

    expect(participationRate, 'Participation rate should be realistic').toBeGreaterThan(
      10
    )
    expect(participationRate, 'Participation rate should be realistic').toBeLessThan(90)

    // Should have votes across different channels
    const hasMultipleChannels = [
      data.nonDtcVoteStatus.printShares > 0,
      data.nonDtcVoteStatus.webShares > 0,
      data.nonDtcVoteStatus.ivrShares > 0,
    ].filter(Boolean).length

    console.warn(`🔀 Voting channels with activity: ${hasMultipleChannels}`)
    // Don't require all channels, but should have at least one if there are votes
    if (data.nonDtcVoteStatus.votedSubtotalShares > 0) {
      expect(
        hasMultipleChannels,
        'Should have activity in at least one voting channel'
      ).toBeGreaterThan(0)
    }
  })
})
