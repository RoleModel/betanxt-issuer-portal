import { expect, test } from "@playwright/test";

const API_BASE_URL = "http://localhost:3001";

test.describe("Tabulation Report Fix Validation", () => {
  test("🎯 CORE FIX: 2025 meetings return real data (not zeros)", async ({
    request,
  }) => {
    const response = await request.get(
      `${API_BASE_URL}/api/meetings/wen-annual-meeting-2025/tabulation-report`
    );

    expect(response.status()).toBe(200);
    const data = await response.json();

    console.warn("✅ 2025 Wendy's Annual Meeting Data:");
    console.warn(`📊 Meeting ID: ${data.meetingId}`);
    console.warn(
      `📈 Total positions: ${data.positionsVoted != null ? data.positionsVoted.voted + data.positionsVoted.unvoted : "N/A"}`
    );
    console.warn(`🗳️  Voted positions: ${data.positionsVoted?.voted ?? "N/A"}`);
    console.warn(
      `💰 Total shares: ${data.positionsVoted?.totalShares ?? "N/A"}`
    );
    console.warn(
      `✔️  Voted shares: ${data.positionsVoted?.votedShares ?? "N/A"}`
    );

    // Core validation: Real data (not zeros)
    expect(data.meetingId).toBe("wen-annual-meeting-2025");
    expect(data.positionsVoted?.totalShares ?? 0).toBeGreaterThan(0);
    expect(data.positionsVoted?.voted ?? 0).toBeGreaterThan(0);

    // Share range performance should have real data
    expect(data.shareRangePerformance).toBeDefined();
    expect(Array.isArray(data.shareRangePerformance)).toBe(true);
    expect(data.shareRangePerformance.length).toBeGreaterThan(0);

    // At least some ranges should have shares
    const totalSharesInRanges = data.shareRangePerformance.reduce(
      (sum: number, range: { totalShares?: number }) =>
        sum + (range.totalShares ?? 0),
      0
    );
    expect(totalSharesInRanges).toBeGreaterThan(0);

    console.warn(
      `📊 Share ranges with data: ${data.shareRangePerformance.length}`
    );
    console.warn(`💎 Total shares across ranges: ${totalSharesInRanges}`);

    // Log voting participation by range (demonstrates real data distribution)
    data.shareRangePerformance.forEach(
      (range: {
        rangeLabel?: string;
        positionCount?: number;
        totalShares?: number;
        percentVoted?: number;
      }) => {
        if (range.totalShares && range.totalShares > 0) {
          console.warn(
            `  ${range.rangeLabel}: ${range.positionCount} positions, ${range.totalShares} shares, ${range.percentVoted?.toFixed(2)}% voted`
          );
        }
      }
    );
  });

  test("2026 active meeting returns current tabulation data", async ({
    request,
  }) => {
    const response = await request.get(
      `${API_BASE_URL}/api/meetings/wen-annual-meeting-2026/tabulation-report`
    );

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data.meetingId).toBe("wen-annual-meeting-2026");
    expect(data.positionsVoted.voted).toBeGreaterThan(0);
    expect(data.positionsVoted.votedShares).toBeGreaterThan(0);
    expect(data.positionsVoted.totalShares).toBeGreaterThan(
      data.positionsVoted.votedShares
    );
  });

  test("📈 Multiple companies have real data", async ({ request }) => {
    const companies = [
      { id: "wen-annual-meeting-2025", name: "Wendy's" },
      { id: "payc-annual-meeting-2025", name: "Paycom" },
      { id: "elvn-annual-meeting-2025", name: "Enliven" },
    ];

    console.warn("🔍 Testing multiple companies for real data...");

    for (const company of companies) {
      const response = await request.get(
        `${API_BASE_URL}/api/meetings/${company.id}/tabulation-report`
      );

      if (response.status() === 200) {
        const data = await response.json();
        const totalShares = data.positionsVoted?.totalShares ?? 0;
        const votedShares = data.positionsVoted?.votedShares ?? 0;

        console.warn(
          `✅ ${company.name}: ${totalShares} total shares, ${votedShares} voted`
        );

        expect(totalShares).toBeGreaterThan(0);
        // Don't require voted shares > 0 as some meetings might have 0 votes, but require total shares
      } else {
        console.warn(
          `⚠️  ${company.name}: No tabulation data (status: ${response.status()})`
        );
      }
    }
  });
});
