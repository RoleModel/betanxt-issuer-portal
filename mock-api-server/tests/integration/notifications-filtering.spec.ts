import { expect, test } from "@playwright/test";

test.describe("Notifications API - Client Filtering", () => {
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";

  test("filters notifications by ticker - WEN only returns WEN notifications", async ({
    request,
  }) => {
    const response = await request.get(`${API_BASE}/notifications?ticker=WEN`);
    expect(response.ok()).toBeTruthy();

    const notifications = await response.json();
    expect(Array.isArray(notifications)).toBeTruthy();

    // All notifications should be for WEN meetings
    for (const notification of notifications) {
      if (notification.meetingId) {
        expect(notification.meetingId).toMatch(/^wen-/);
      }
    }
  });

  test("filters notifications by ticker - PAYC only returns PAYC notifications", async ({
    request,
  }) => {
    const response = await request.get(`${API_BASE}/notifications?ticker=PAYC`);
    expect(response.ok()).toBeTruthy();

    const notifications = await response.json();
    expect(Array.isArray(notifications)).toBeTruthy();

    // All notifications should be for PAYC meetings
    for (const notification of notifications) {
      if (notification.meetingId) {
        expect(notification.meetingId).toMatch(/^payc-/);
      }
    }
  });

  test("different tickers return different notification sets", async ({
    request,
  }) => {
    const wenResponse = await request.get(
      `${API_BASE}/notifications?ticker=WEN`
    );
    const paycResponse = await request.get(
      `${API_BASE}/notifications?ticker=PAYC`
    );

    const wenNotifications = await wenResponse.json();
    const paycNotifications = await paycResponse.json();

    // Should have different notification sets
    const wenIds = wenNotifications.map((n: { id: string }) => n.id);
    const paycIds = new Set(paycNotifications.map((n: { id: string }) => n.id));

    // No overlap in notification IDs between different clients
    const overlap = wenIds.filter((id: string) => paycIds.has(id));
    expect(overlap.length).toBe(0);
  });

  test("filters notifications by specific meetingId", async ({ request }) => {
    const meetingId = "wen-annual-meeting-2025";
    const response = await request.get(
      `${API_BASE}/notifications?meetingId=${meetingId}`
    );
    expect(response.ok()).toBeTruthy();

    const notifications = await response.json();

    // All notifications should be for the specific meeting
    for (const notification of notifications) {
      if (notification.meetingId) {
        expect(notification.meetingId).toBe(meetingId);
      }
    }
  });

  test("returns empty array for ticker with no meetings", async ({
    request,
  }) => {
    const response = await request.get(
      `${API_BASE}/notifications?ticker=NONEXISTENT`
    );
    expect(response.ok()).toBeTruthy();

    const notifications = await response.json();
    expect(notifications).toEqual([]);
  });
});
