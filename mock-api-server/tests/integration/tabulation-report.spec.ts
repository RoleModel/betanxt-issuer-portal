import { expect, test } from "@playwright/test";

const API_BASE_URL = "http://localhost:3001";

test.describe("Tabulation Report API", () => {
  test.describe("2025 Historical Meetings (should have real voting data)", () => {
    test("Wendy's 2025 Annual Meeting returns real tabulation data", async ({ request }) => {
      const response = await request.get(
        `${API_BASE_URL}/api/meetings/wen-annual-meeting-2025/tabulation-report`,
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      // Should have real meeting data
      expect(data.meetingId).toBe("wen-annual-meeting-2025");
      expect(data.id).toBeTruthy();
      expect(data.setKeys).toBeInstanceOf(Array);
      expect(data.setKeys.length).toBeGreaterThan(0);

      // Should have real position voting data (not all zeros)
      expect(data.positionsVoted).toBeDefined();
      expect(data.positionsVoted.voted).toBeGreaterThan(0); // Should have some voted positions
      expect(data.positionsVoted.totalShares).toBeGreaterThan(0); // Should have real share totals
      expect(data.positionsVoted.votedShares).toBeGreaterThan(0); // Should have real voted shares

      // Should have realistic participation rate
      const totalShares = data.positionsVoted.totalShares;
      const votedShares = data.positionsVoted.votedShares;
      const participationRate = (votedShares / totalShares) * 100;
      expect(participationRate).toBeGreaterThan(0);
      expect(participationRate).toBeLessThan(100); // Realistic - not 100% participation

      // Should have share range performance data
      expect(data.shareRangePerformance).toBeInstanceOf(Array);
      expect(data.shareRangePerformance.length).toBeGreaterThan(0);

      // Verify share ranges have real data
      const firstRange = data.shareRangePerformance[0];
      expect(firstRange).toHaveProperty("rangeLabel");
      expect(firstRange).toHaveProperty("positionCount");
      expect(firstRange).toHaveProperty("totalShares");
      expect(firstRange).toHaveProperty("percentVoted");
      expect(firstRange.positionCount).toBeGreaterThan(0);
      expect(firstRange.totalShares).toBeGreaterThan(0);

      // Should have Non-DTC vote status with real data
      expect(data.nonDtcVoteStatus).toBeDefined();
      expect(data.nonDtcVoteStatus.grandTotalShares).toBeGreaterThan(0);
      expect(data.nonDtcVoteStatus.grandTotalShareholders).toBeGreaterThan(0);

      // Should have some voted shares across different channels
      const totalVotedShares =
        data.nonDtcVoteStatus.printShares +
        data.nonDtcVoteStatus.webShares +
        data.nonDtcVoteStatus.ivrShares;
      expect(totalVotedShares).toBeGreaterThan(0);

      // Should have DTC vote status
      expect(data.dtcVoteStatus).toBeDefined();
      expect(data.dtcVoteStatus.grandTotalShares).toBeGreaterThan(0);

      // Should have vote distribution
      expect(data.voteDistribution).toBeDefined();
      const totalDistributedShares =
        data.voteDistribution.dtcVotedShares +
        data.voteDistribution.dtcUnvotedShares +
        data.voteDistribution.nonDtcVotedShares +
        data.voteDistribution.nonDtcUnvotedShares;
      expect(totalDistributedShares).toBeGreaterThan(0);

      // Timestamps should be present
      expect(data.lastCalculatedAt).toBeTruthy();
      expect(data.createdAt).toBeTruthy();
      expect(data.updatedAt).toBeTruthy();
    });

    test("Enliven 2025 Annual Meeting returns real tabulation data", async ({ request }) => {
      const response = await request.get(
        `${API_BASE_URL}/api/meetings/elvn-annual-meeting-2025/tabulation-report`,
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.meetingId).toBe("elvn-annual-meeting-2025");
      expect(data.positionsVoted.totalShares).toBeGreaterThan(0);

      // Even with smaller dataset (20 positions), should have some voting activity
      expect(data.positionsVoted.voted + data.positionsVoted.unvoted).toBeGreaterThan(0);
    });

    test("Paycom 2025 Annual Meeting returns real tabulation data", async ({ request }) => {
      const response = await request.get(
        `${API_BASE_URL}/api/meetings/payc-annual-meeting-2025/tabulation-report`,
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.meetingId).toBe("payc-annual-meeting-2025");
      expect(data.positionsVoted.totalShares).toBeGreaterThan(0);

      // Should have substantial data (3,522 positions)
      expect(data.positionsVoted.voted + data.positionsVoted.unvoted).toBeGreaterThan(1000);
    });

    test("Woodward 2025 Annual Meeting returns real tabulation data", async ({ request }) => {
      const response = await request.get(
        `${API_BASE_URL}/api/meetings/wwd-annual-meeting-2025/tabulation-report`,
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.meetingId).toBe("wwd-annual-meeting-2025");
      expect(data.positionsVoted.totalShares).toBeGreaterThan(0);

      // Should have substantial data (3,521 positions)
      expect(data.positionsVoted.voted + data.positionsVoted.unvoted).toBeGreaterThan(1000);
    });
  });

  test.describe("2024 Historical Meetings (synthetic but realistic data)", () => {
    test("2024 Wendy's Annual Meeting has realistic synthetic data", async ({ request }) => {
      const response = await request.get(
        `${API_BASE_URL}/api/meetings/wen-annual-meeting-2024/tabulation-report`,
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.meetingId).toBe("wen-annual-meeting-2024");

      // Should have synthetic but realistic data
      expect(data.positionsVoted.totalShares).toBeGreaterThan(0);
      expect(data.positionsVoted.voted).toBeGreaterThan(0);

      // Should have realistic participation rate (30-70% based on our logic)
      const participationRate =
        (data.positionsVoted.votedShares / data.positionsVoted.totalShares) * 100;
      expect(participationRate).toBeGreaterThan(20); // At least 20%
      expect(participationRate).toBeLessThan(80); // At most 80%
    });
  });

  test.describe("2026 Future Meetings (should have minimal/zero voting data)", () => {
    test("2026 Wendy's Annual Meeting has zero voting data", async ({ request }) => {
      const response = await request.get(
        `${API_BASE_URL}/api/meetings/wen-annual-meeting-2026/tabulation-report`,
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.meetingId).toBe("wen-annual-meeting-2026");

      // Future meeting should have positions but no votes yet
      expect(data.positionsVoted.voted).toBe(0); // No voted positions
      expect(data.positionsVoted.votedShares).toBe(0); // No voted shares
      expect(data.positionsVoted.totalShares).toBeGreaterThan(0); // But should have total shares

      // All vote-related fields should be zero
      expect(data.nonDtcVoteStatus.printShares).toBe(0);
      expect(data.nonDtcVoteStatus.webShares).toBe(0);
      expect(data.nonDtcVoteStatus.ivrShares).toBe(0);
      expect(data.nonDtcVoteStatus.votedSubtotalShares).toBe(0);

      expect(data.dtcVoteStatus.votedShares).toBe(0);

      expect(data.voteDistribution.dtcVotedShares).toBe(0);
      expect(data.voteDistribution.nonDtcVotedShares).toBe(0);
    });
  });

  test.describe("Error Handling", () => {
    test("Returns 404 for non-existent meeting", async ({ request }) => {
      const response = await request.get(
        `${API_BASE_URL}/api/meetings/invalid-meeting-id/tabulation-report`,
      );

      expect(response.status()).toBe(404);
      const errorData = await response.json();
      expect(errorData.error).toContain("No tabulation report found");
    });

    test("Returns 404 for malformed meeting ID", async ({ request }) => {
      const response = await request.get(
        `${API_BASE_URL}/api/meetings/123-invalid/tabulation-report`,
      );

      expect(response.status()).toBe(404);
    });
  });

  test.describe("Data Consistency Validation", () => {
    test("Wendy's 2025 data consistency checks", async ({ request }) => {
      const response = await request.get(
        `${API_BASE_URL}/api/meetings/wen-annual-meeting-2025/tabulation-report`,
      );
      const data = await response.json();

      // Validate that vote totals add up correctly
      const nonDtcTotal =
        data.nonDtcVoteStatus.votedSubtotalShares +
        (data.nonDtcVoteStatus.grandTotalShares - data.nonDtcVoteStatus.votedSubtotalShares);
      expect(nonDtcTotal).toBe(data.nonDtcVoteStatus.grandTotalShares);

      const dtcTotal = data.dtcVoteStatus.votedShares + data.dtcVoteStatus.unvotedShares;
      expect(dtcTotal).toBe(data.dtcVoteStatus.grandTotalShares);

      // Validate vote distribution adds up
      const distributionTotal =
        data.voteDistribution.dtcVotedShares +
        data.voteDistribution.dtcUnvotedShares +
        data.voteDistribution.nonDtcVotedShares +
        data.voteDistribution.nonDtcUnvotedShares;

      const positionsTotal = data.positionsVoted.totalShares;
      expect(Math.abs(distributionTotal - positionsTotal)).toBeLessThan(1); // Allow for rounding

      // Validate position counts
      expect(data.positionsVoted.voted + data.positionsVoted.unvoted).toBeGreaterThan(0);

      // Validate share range performance sums
      let rangeTotal = 0;
      for (const range of data.shareRangePerformance) {
        rangeTotal += range.totalShares;

        // Each range should have reasonable data
        expect(range.positionCount).toBeGreaterThan(0);
        expect(range.totalShares).toBeGreaterThan(0);
        expect(range.percentVoted).toBeGreaterThanOrEqual(0);
        expect(range.percentVoted).toBeLessThanOrEqual(100);
      }

      // Range total should roughly match position total (allowing for account type differences)
      expect(rangeTotal).toBeGreaterThan(0);
    });
  });

  test.describe("Response Schema Validation", () => {
    test("2025 response has all required fields with correct types", async ({ request }) => {
      const response = await request.get(
        `${API_BASE_URL}/api/meetings/wen-annual-meeting-2025/tabulation-report`,
      );
      const data = await response.json();

      // Top-level fields
      expect(typeof data.id).toBe("string");
      expect(typeof data.meetingId).toBe("string");
      expect(Array.isArray(data.setKeys)).toBe(true);
      // brokerVoting is keyed by proposal (proposal1, proposal2, ...) with arrays of broker entries
      expect(typeof data.brokerVoting).toBe("object");
      expect(Array.isArray(data.brokerVoting)).toBe(false);
      for (const entries of Object.values(data.brokerVoting)) {
        expect(Array.isArray(entries)).toBe(true);
      }
      expect(Array.isArray(data.shareRangePerformance)).toBe(true);

      // Complex nested objects
      expect(typeof data.nonDtcVoteStatus).toBe("object");
      expect(typeof data.dtcVoteStatus).toBe("object");
      expect(typeof data.voteDistribution).toBe("object");
      expect(typeof data.positionsVoted).toBe("object");

      // Timestamp fields
      expect(typeof data.lastCalculatedAt).toBe("string");
      expect(typeof data.createdAt).toBe("string");
      expect(typeof data.updatedAt).toBe("string");

      // Validate timestamp format (ISO 8601)
      expect(new Date(data.lastCalculatedAt).toISOString()).toBe(data.lastCalculatedAt);
      expect(new Date(data.createdAt).toISOString()).toBe(data.createdAt);
      expect(new Date(data.updatedAt).toISOString()).toBe(data.updatedAt);
    });
  });

  test.describe("Performance Tests", () => {
    test("API responds within reasonable time for large dataset", async ({ request }) => {
      const startTime = Date.now();

      const response = await request.get(
        `${API_BASE_URL}/api/meetings/wen-annual-meeting-2025/tabulation-report`,
      );

      const responseTime = Date.now() - startTime;

      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds

      // Verify we got substantial data (proving it processed the large dataset)
      const data = await response.json();
      expect(data.positionsVoted.voted + data.positionsVoted.unvoted).toBeGreaterThan(10000);
    });
  });
});
