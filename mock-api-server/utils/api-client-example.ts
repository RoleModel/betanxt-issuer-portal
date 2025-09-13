/**
 * Example usage of the API client
 * This file demonstrates how to use the type-safe API client
 */

import { auth, users, events, roles, apiClient } from './api-client';

// Example: Authentication flow
export const exampleAuthFlow = async () => {
  try {
    // Login
    const loginResult = await auth.login('user@example.com', 'password123');
    if (loginResult.error) {
      console.error('Login failed:', loginResult.error);
      return;
    }

    console.log('Login successful:', loginResult.data?.user);

    // Get current user
    const currentUser = await auth.getCurrentUser();
    if (currentUser.data) {
      console.log('Current user:', currentUser.data);
    }

    // Logout
    await auth.logout();
    console.log('Logged out successfully');
  } catch (error) {
    console.error('Auth flow error:', error);
  }
};

// Example: User management
export const exampleUserManagement = async () => {
  try {
    // List users with pagination
    const usersResult = await users.list({
      page: 1,
      limit: 10,
      role: 'admin',
    });

    if (usersResult.data) {
      console.log('Users:', usersResult.data.users);
      console.log('Pagination:', usersResult.data.pagination);
    }

    // Create a new user
    const newUserResult = await users.create({
      email: 'newuser@example.com',
      name: 'New User',
      password: 'securepassword',
      roleId: 'role-uuid-here',
    });

    if (newUserResult.data) {
      console.log('Created user:', newUserResult.data);

      // Update the user
      const updateResult = await users.update(newUserResult.data.id, {
        name: 'Updated Name',
        isActive: true,
      });

      if (updateResult.data) {
        console.log('Updated user:', updateResult.data);
      }
    }
  } catch (error) {
    console.error('User management error:', error);
  }
};

// Example: Event management
export const exampleEventManagement = async () => {
  try {
    // List events with filters
    const eventsResult = await events.list({
      page: 1,
      limit: 20,
      status: 'ACTIVE',
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-12-31T23:59:59Z',
    });

    if (eventsResult.data) {
      console.log('Events:', eventsResult.data.events);
    }

    // Create a new event
    const newEventResult = await events.create({
      title: 'Annual Shareholder Meeting',
      description: 'Important annual meeting for all shareholders',
      startDate: '2024-06-15T10:00:00Z',
      endDate: '2024-06-15T16:00:00Z',
      location: 'Corporate Headquarters',
      maxAttendees: 500,
      isPublic: false,
    });

    if (newEventResult.data) {
      console.log('Created event:', newEventResult.data);

      // Update event status
      const updateResult = await events.update(newEventResult.data.id, {
        status: 'ACTIVE',
      });

      if (updateResult.data) {
        console.log('Updated event:', updateResult.data);
      }
    }
  } catch (error) {
    console.error('Event management error:', error);
  }
};

// Example: Role management
export const exampleRoleManagement = async () => {
  try {
    // List all roles
    const rolesResult = await roles.list();
    if (rolesResult.data) {
      console.log('Available roles:', rolesResult.data);
    }

    // Create a new role
    const newRoleResult = await roles.create({
      name: 'Event Manager',
      description: 'Can manage events and view user data',
      permissionIds: ['permission-uuid-1', 'permission-uuid-2'],
    });

    if (newRoleResult.data) {
      console.log('Created role:', newRoleResult.data);
    }
  } catch (error) {
    console.error('Role management error:', error);
  }
};

// Example: Custom API call using the raw client
export const exampleCustomApiCall = async () => {
  try {
    // You can also use the raw client for custom endpoints or advanced usage
    const { data, error } = await apiClient.GET('/users/{id}', {
      params: {
        path: { id: 'user-uuid-here' },
      },
    });

    if (error) {
      console.error('API Error:', error);
      return;
    }

    console.log('User data:', data);
  } catch (error) {
    console.error('Custom API call error:', error);
  }
};

// Example: Error handling patterns
export const exampleErrorHandling = async () => {
  try {
    const result = await users.getById('non-existent-id');

    if (result.error) {
      // Handle different error types
      switch (result.response.status) {
        case 404:
          console.log('User not found');
          break;
        case 401:
          console.log('Unauthorized - please login');
          break;
        case 403:
          console.log('Forbidden - insufficient permissions');
          break;
        default:
          console.log('Unexpected error:', result.error);
      }
    } else {
      console.log('User found:', result.data);
    }
  } catch (error) {
    console.error('Network or other error:', error);
  }
};
