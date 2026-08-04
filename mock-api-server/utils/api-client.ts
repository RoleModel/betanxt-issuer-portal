import createClient from "openapi-fetch";
import type { FetchResponse } from "openapi-fetch";

import type { paths } from "../types/api";

// Create the base API client
export const apiClient = createClient<paths>({
  baseUrl: process.env.API_BASE_URL ?? "http://localhost:3000/api",
});

// Authentication token management
let authToken: string | null = null;

export const setAuthToken = (token: string | null): void => {
  authToken = token;
};

export const getAuthToken = (): string | null => authToken;

// Convenience methods for common operations
export const auth = {
  async login(
    username: string,
    password: string
  ): Promise<FetchResponse<paths["/auth/login"]["post"]>> {
    const result = await apiClient.POST("/auth/login", {
      body: { username, password },
    });

    if (result.data?.token) {
      setAuthToken(result.data.token);
    }

    return result;
  },

  async logout(): Promise<FetchResponse<paths["/auth/logout"]["post"]>> {
    const result = await apiClient.POST("/auth/logout");
    setAuthToken(null);
    return result;
  },

  getCurrentUser: async (): Promise<FetchResponse<paths["/auth/me"]["get"]>> =>
    await apiClient.GET("/auth/me"),
};

export const users = {
  list: async (parameters?: {
    page?: number;
    limit?: number;
    role?: string;
  }): Promise<FetchResponse<paths["/users"]["get"]>> =>
    await apiClient.GET("/users", {
      params: { query: parameters },
    }),

  create: async (userData: {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    type: "ADMIN" | "ISSUER" | "RELATIONSHIP_MANAGER";
    accountId?: string;
  }): Promise<FetchResponse<paths["/users"]["post"]>> =>
    await apiClient.POST("/users", {
      body: userData,
    }),

  getById: async (
    id: string
  ): Promise<FetchResponse<paths["/users/{id}"]["get"]>> =>
    await apiClient.GET("/users/{id}", {
      params: { path: { id } },
    }),

  update: async (
    id: string,
    userData: {
      firstName?: string;
      lastName?: string;
      email?: string;
      type?: "ADMIN" | "ISSUER" | "RELATIONSHIP_MANAGER";
      accountId?: string;
    }
  ): Promise<FetchResponse<paths["/users/{id}"]["put"]>> =>
    await apiClient.PUT("/users/{id}", {
      params: { path: { id } },
      body: userData,
    }),

  delete: async (
    id: string
  ): Promise<FetchResponse<paths["/users/{id}"]["delete"]>> =>
    await apiClient.DELETE("/users/{id}", {
      params: { path: { id } },
    }),
};

export const meetings = {
  list: async (parameters?: {
    page?: number;
    limit?: number;
    status?: "ACTIVE" | "ADJOURNED" | "COMPLETE";
    clientId?: string;
    meetingYear?: number;
    cusip?: string;
    ticker?: string;
  }): Promise<FetchResponse<paths["/meetings"]["get"]>> =>
    await apiClient.GET("/meetings", {
      params: { query: parameters },
    }),

  create: async (meetingData: {
    id: string;
    title: string;
    cusip: string;
    ticker: string;
    recordDate: string;
    mailingDate: string;
    meetingDate: string;
    meetingType: string;
    meetingYear: number;
    distributionType: string;
    transferAgent: string;
    totalSharesOutstanding: string;
    quorumRequirement: number;
    clientId: string;
    employeeStockPlans?: string;
    planAdministrator?: string;
    planAdministratorContact?: string;
    planAdministratorContactEmail?: string;
    solicitor?: string;
    solicitorEmail?: string;
  }): Promise<FetchResponse<paths["/meetings"]["post"]>> =>
    await apiClient.POST("/meetings", {
      body: meetingData,
    }),

  getById: async (
    id: string
  ): Promise<FetchResponse<paths["/meetings/{meetingId}"]["get"]>> =>
    await apiClient.GET("/meetings/{meetingId}", {
      params: { path: { meetingId: id } },
    }),

  update: async (
    id: string,
    meetingData: {
      title?: string;
      recordDate?: string;
      mailingDate?: string;
      meetingDate?: string;
      meetingType?: string;
      status?: "ACTIVE" | "ADJOURNED" | "COMPLETE";
      currentPhase?: string;
      overallCompletion?: number;
      distributionType?: string;
      transferAgent?: string;
      employeeStockPlans?: string;
      planAdministrator?: string;
      planAdministratorContact?: string;
      planAdministratorContactEmail?: string;
      solicitor?: string;
      solicitorEmail?: string;
      documentHostingSiteLabel?: string;
      documentHostingSiteUrl?: string;
      eVoteSiteLabel?: string;
      eVoteSiteUrl?: string;
      ivrDialInNumber?: string;
      totalSharesOutstanding?: string;
      quorumRequirement?: number;
    }
  ): Promise<FetchResponse<paths["/meetings/{meetingId}"]["put"]>> =>
    await apiClient.PUT("/meetings/{meetingId}", {
      params: { path: { meetingId: id } },
      body: meetingData,
    }),

  delete: async (
    id: string
  ): Promise<FetchResponse<paths["/meetings/{meetingId}"]["delete"]>> =>
    await apiClient.DELETE("/meetings/{meetingId}", {
      params: { path: { meetingId: id } },
    }),
};

// Add more API methods as needed for accounts, phases, tasks, documents, etc.

// Export the main client for custom usage
export default apiClient;
