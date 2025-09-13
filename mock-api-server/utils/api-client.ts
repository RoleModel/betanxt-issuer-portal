import createClient from 'openapi-fetch';
import type { paths } from '../types/api';

// Create the base API client
export const apiClient = createClient<paths>({
  baseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
});

// Authentication token management
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    apiClient.use({
      onRequest({ request }) {
        request.headers.set('Authorization', `Bearer ${token}`);
        return request;
      },
    });
  }
};

export const getAuthToken = () => authToken;

// Convenience methods for common operations
export const auth = {
  async login(email: string, password: string) {
    const { data, error } = await apiClient.POST('/auth/login', {
      body: { email, password },
    });

    if (data?.token) {
      setAuthToken(data.token);
    }

    return { data, error };
  },

  async logout() {
    const result = await apiClient.POST('/auth/logout');
    setAuthToken(null);
    return result;
  },

  async getCurrentUser() {
    return await apiClient.GET('/auth/me');
  },
};

export const users = {
  async list(params?: {
    page?: number;
    limit?: number;
    role?: string;
  }) {
    return await apiClient.GET('/users', {
      params: { query: params },
    });
  },

  async create(userData: {
    email: string;
    name: string;
    password: string;
    roleId: string;
  }) {
    return await apiClient.POST('/users', {
      body: userData,
    });
  },

  async getById(id: string) {
    return await apiClient.GET('/users/{id}', {
      params: { path: { id } },
    });
  },

  async update(id: string, userData: {
    name?: string;
    roleId?: string;
    isActive?: boolean;
  }) {
    return await apiClient.PUT('/users/{id}', {
      params: { path: { id } },
      body: userData,
    });
  },

  async delete(id: string) {
    return await apiClient.DELETE('/users/{id}', {
      params: { path: { id } },
    });
  },
};

export const events = {
  async list(params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    return await apiClient.GET('/event', {
      params: { query: params },
    });
  },

  async create(eventData: {
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    location?: string;
    maxAttendees?: number;
    isPublic?: boolean;
  }) {
    return await apiClient.POST('/event', {
      body: eventData,
    });
  },

  async getById(id: string) {
    return await apiClient.GET('/event/{id}', {
      params: { path: { id } },
    });
  },

  async update(id: string, eventData: {
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    maxAttendees?: number;
    isPublic?: boolean;
    status?: 'DRAFT' | 'ACTIVE' | 'COMPLETE' | 'ADJOURNED';
  }) {
    return await apiClient.PUT('/event/{id}', {
      params: { path: { id } },
      body: eventData,
    });
  },

  async delete(id: string) {
    return await apiClient.DELETE('/event/{id}', {
      params: { path: { id } },
    });
  },
};

export const roles = {
  async list() {
    return await apiClient.GET('/roles');
  },

  async create(roleData: {
    name: string;
    description: string;
    permissionIds?: string[];
  }) {
    return await apiClient.POST('/roles', {
      body: roleData,
    });
  },
};

// Export the main client for custom usage
export default apiClient;
