import createClient from "openapi-fetch";

import type { paths } from "../generated-schema";

/**
 * Shared OpenAPI client instance for the Issuer Portal.
 * This wraps openapi-fetch to provide typed path operations based on the
 * generated OpenAPI schema. All API calls should flow through here so we can
 * later add auth headers, logging, tracing, etc.
 */
export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:3001/api";

export const apiClient = createClient<paths>({ baseUrl: apiBaseUrl });

// Helper for injecting bearer token at callsite without recreating client
export function withAuth(token?: string) {
  if (!token) return apiClient;
  return createClient<paths>({
    baseUrl: apiBaseUrl,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export type ApiClient = typeof apiClient;
