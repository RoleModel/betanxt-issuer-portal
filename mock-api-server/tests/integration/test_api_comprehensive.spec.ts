import { expect, test } from "@playwright/test";

test.describe("Comprehensive API Tests", () => {
  const API_BASE_URL = "http://localhost:3001/api";

  // Meeting API Tests
  test.describe("Meeting API", () => {
    test("GET /api/meetings should return paginated results", async ({
      request,
    }) => {
      const response = await request.get(`${API_BASE_URL}/meetings`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("meetings");
      expect(data).toHaveProperty("pagination");
      expect(data.pagination).toHaveProperty("total");
      expect(data.pagination).toHaveProperty("page");
      expect(data.pagination).toHaveProperty("limit");
      expect(Array.isArray(data.meetings)).toBe(true);
    });

    test("GET /api/meetings with filters should work", async ({ request }) => {
      const response = await request.get(
        `${API_BASE_URL}/meetings?status=ACTIVE&meetingYear=2025`
      );
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("meetings");
    });
  });

  // Position API Tests
  test.describe("Position API", () => {
    test("GET /api/positions should return positions", async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/positions`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("positions");
      expect(Array.isArray(data.positions)).toBe(true);
    });

    test("GET /api/positions with meetingId filter should work", async ({
      request,
    }) => {
      const response = await request.get(
        `${API_BASE_URL}/positions?meetingId=ELVN-2025-SM`
      );
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("positions");
      expect(Array.isArray(data.positions)).toBe(true);
    });
  });

  // Task API Tests
  test.describe("Task API", () => {
    test("GET /api/meetings/{meetingId}/tasks should return tasks for meeting", async ({
      request,
    }) => {
      const response = await request.get(
        `${API_BASE_URL}/meetings/ELVN-2025-SM/tasks`
      );
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test("GET /api/meetings/{meetingId}/tasks with no filters should return all tasks for meeting", async ({
      request,
    }) => {
      const response = await request.get(
        `${API_BASE_URL}/meetings/ELVN-2025-SM/tasks`
      );
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  // Document API Tests
  test.describe("Document API", () => {
    test("GET /api/meetings/{meetingId}/documents should return documents for meeting", async ({
      request,
    }) => {
      const response = await request.get(
        `${API_BASE_URL}/meetings/ELVN-2025-SM/documents`
      );
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test("GET /api/meetings/{meetingId}/documents with no filters should return all documents for meeting", async ({
      request,
    }) => {
      const response = await request.get(
        `${API_BASE_URL}/meetings/ELVN-2025-SM/documents`
      );
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  // Proposal API Tests
  test.describe("Proposal API", () => {
    test("GET /api/meetings/{meetingId}/proposals should return proposals for meeting", async ({
      request,
    }) => {
      const response = await request.get(
        `${API_BASE_URL}/meetings/ELVN-2025-SM/proposals`
      );
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test("GET /api/meetings/{meetingId}/proposals with no filters should return all proposals for meeting", async ({
      request,
    }) => {
      const response = await request.get(
        `${API_BASE_URL}/meetings/ELVN-2025-SM/proposals`
      );
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  // Phase API Tests
  test.describe("Phase API", () => {
    test("GET /api/meetings/{meetingId}/phases should return phases for meeting", async ({
      request,
    }) => {
      const response = await request.get(
        `${API_BASE_URL}/meetings/ELVN-2025-SM/phases`
      );
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test("GET /api/meetings/{meetingId}/phases with no filters should return all phases for meeting", async ({
      request,
    }) => {
      const response = await request.get(
        `${API_BASE_URL}/meetings/ELVN-2025-SM/phases`
      );
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  // Health Check
  test.describe("Health Check", () => {
    test("GET /api/health should return OK", async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/health`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.status).toBe("OK");
    });
  });

  // Error Handling Tests
  test.describe("Error Handling", () => {
    test("should handle 404 for non-existent meeting", async ({ request }) => {
      const response = await request.get(
        `${API_BASE_URL}/meetings/non-existent-id`
      );
      expect(response.status()).toBe(404);
    });

    test("should handle invalid query parameters gracefully", async ({
      request,
    }) => {
      const response = await request.get(
        `${API_BASE_URL}/meetings?invalidParam=value&page=abc`
      );
      // Should either work (ignoring invalid params) or return a validation error
      expect([200, 400]).toContain(response.status());
    });

    test("should validate required fields on POST", async ({ request }) => {
      const invalidMeeting = {
        title: "Test Meeting", // Missing required fields
      };

      const response = await request.post(`${API_BASE_URL}/meetings`, {
        data: invalidMeeting,
      });

      expect([400, 422]).toContain(response.status());
    });
  });
});
