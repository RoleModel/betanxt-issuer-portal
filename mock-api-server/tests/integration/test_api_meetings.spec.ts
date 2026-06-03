import { expect, test } from "@playwright/test";

import type { components } from "@/types/api";

type Meeting = components["schemas"]["Meeting"];

test.describe("Meeting API Endpoints", () => {
  const API_BASE_URL = "http://localhost:3001/api";

  test("GET /api/meetings should return meetings list", async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/meetings`);

    // If error, show the response
    if (response.status() !== 200) {
      const errorData = await response.json();
      console.error("API Error:", response.status(), errorData);
    }

    // Check response status
    expect(response.status()).toBe(200);

    // Parse response
    const data = await response.json();

    // Check response structure
    expect(data).toHaveProperty("meetings");
    expect(Array.isArray(data.meetings)).toBe(true);

    // If there are meetings, check their structure
    if (data.meetings.length > 0) {
      const meeting = data.meetings[0];
      expect(meeting).toHaveProperty("id");
      expect(meeting).toHaveProperty("title");
      expect(meeting).toHaveProperty("meetingDate");
      expect(meeting).toHaveProperty("status");
    }
  });

  test("GET /api/meetings with status filter should work", async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/meetings?status=ACTIVE`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("meetings");

    // All returned meetings should have ACTIVE status
    data.meetings.forEach((meeting: Meeting) => {
      expect(meeting.status).toBe("ACTIVE");
    });
  });

  test("GET /api/meetings with pagination should work", async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/meetings?page=1&limit=5`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("meetings");
    expect(data).toHaveProperty("pagination");
    expect(data.pagination).toHaveProperty("total");
    expect(data.pagination).toHaveProperty("page");
    expect(data.pagination).toHaveProperty("limit");

    // Should not return more than the limit
    expect(data.meetings.length).toBeLessThanOrEqual(5);
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(5);
  });

  test("GET /api/meetings/{id} should return specific meeting", async ({ request }) => {
    // First get a meeting ID
    const listResponse = await request.get(`${API_BASE_URL}/meetings?limit=1`);
    const listData = await listResponse.json();

    if (listData.meetings && listData.meetings.length > 0) {
      const meetingId = listData.meetings[0].id;

      // Now fetch specific meeting
      const response = await request.get(`${API_BASE_URL}/meetings/${meetingId}`);

      expect(response.status()).toBe(200);

      const meeting = await response.json();
      expect(meeting).toHaveProperty("id");
      expect(meeting.id).toBe(meetingId);
    }
  });
});
