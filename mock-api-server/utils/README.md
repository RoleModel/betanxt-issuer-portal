# API Client Usage

This directory contains a type-safe API client generated from the OpenAPI specification using `openapi-fetch`.

## Setup

1. **Install dependencies** (already done):

   ```bash
   npm install openapi-fetch openapi-typescript
   ```

2. **Generate types** from OpenAPI spec:
   ```bash
   npm run generate:api-types
   ```

## Usage

### Basic Authentication

```typescript
import { auth } from "@/utils/api-client";

// Login
const { data, error } = await auth.login("user@example.com", "password123");
if (data?.token) {
  console.log("Login successful:", data.user);
}

// Get current user
const currentUser = await auth.getCurrentUser();

// Logout
await auth.logout();
```

### User Management

```typescript
import { users } from "@/utils/api-client";

// List users with pagination
const usersResult = await users.list({
  page: 1,
  limit: 10,
  role: "admin",
});

// Create user
const newUser = await users.create({
  email: "new@example.com",
  name: "New User",
  password: "secure123",
  roleId: "role-uuid",
});

// Update user
await users.update("user-id", {
  name: "Updated Name",
  isActive: true,
});
```

### Event Management

```typescript
import { events } from "@/utils/api-client";

// List events
const eventsResult = await events.list({
  status: "ACTIVE",
  startDate: "2024-01-01T00:00:00Z",
});

// Create event
const newEvent = await events.create({
  title: "Annual Meeting",
  startDate: "2024-06-15T10:00:00Z",
  endDate: "2024-06-15T16:00:00Z",
  location: "HQ",
  isPublic: false,
});
```

### Error Handling

```typescript
const result = await users.getById("user-id");

if (result.error) {
  switch (result.response.status) {
    case 404:
      console.log("User not found");
      break;
    case 401:
      console.log("Unauthorized");
      break;
    case 403:
      console.log("Forbidden");
      break;
    default:
      console.log("Error:", result.error);
  }
} else {
  console.log("User:", result.data);
}
```

### Custom API Calls

```typescript
import apiClient from "@/utils/api-client";

// Direct client usage for custom endpoints
const { data, error } = await apiClient.GET("/custom-endpoint", {
  params: { query: { customParam: "value" } },
});
```

## Features

- ✅ **Type Safety**: Full TypeScript support with auto-generated types
- ✅ **Authentication**: Automatic token management
- ✅ **Error Handling**: Structured error responses
- ✅ **Convenience Methods**: Pre-built methods for common operations
- ✅ **Flexible**: Direct client access for custom usage

## Files

- `api-client.ts` - Main API client with convenience methods
- `api-client-example.ts` - Usage examples and patterns
- `../types/api.ts` - Auto-generated TypeScript types from OpenAPI spec

## Regenerating Types

When the OpenAPI spec changes, regenerate the types:

```bash
npm run generate:api-types
```

This will update `types/api.ts` with the latest API definitions.
