---
applyTo:
  - "mock-api-server/domain-models/**/*"
  - "mock-api-server/app/api/**/*"
  - "mock-api-server/openapi-schema/**/*"
  - "supabase/**/*"
  - "issuer-portal/domain-models/**/*"
  - "issuer-portal/hooks/**/*"
  - "**/*seed*"
  - "**/*migration*"
  - "**/*database*"
---

# Data and API Instructions

This file provides specific guidance for working with data models, API endpoints, database operations, and the schema-driven development workflow in the BetaNXT Issuer Portal.

## Schema-Driven Development Workflow

**CRITICAL**: This project follows a strict schema-first approach where the OpenAPI specification is the single source of truth. Always follow this exact sequence:

### 1. OpenAPI Specification Updates

```yaml
# File: mock-api-server/openapi-schema/openapi.yaml
# This is the SINGLE SOURCE OF TRUTH for all data structures

# Example: Adding a new field to Task schema
components:
  schemas:
    Task:
      type: object
      properties:
        id:
          type: string
        title:
          type: string
        # NEW FIELD - always add here first
        priority:
          type: string
          enum: [LOW, MEDIUM, HIGH, CRITICAL]
```

### 2. Database Schema Generation

```bash
# From mock-api-server directory
npm run generate:postgres-schema
# This creates SQL migrations in supabase/migrations/
```

### 3. Database Reset and Migration

```bash
# Apply new schema to local database
supabase db reset
# This applies all migrations and seed data
```

### 4. TypeScript Type Generation

```bash
# Generate database types
npm run generate:db-types

# Generate API types
npx openapi-typescript ./openapi-schema/openapi.yaml -o ./types/api.ts
```

### 5. Domain Model Updates (MANUAL)

**CRITICAL**: Domain models are manually implemented and must be updated when adding OpenAPI fields.

```typescript
// File: mock-api-server/domain-models/api/tasks.ts
function transformTask(dbTask: DatabaseRow): Task {
  return {
    id: dbTask.id,
    title: dbTask.title,
    // MUST ADD: New field mapping for priority
    priority: dbTask.priority,

    // Foreign keys (snake_case → camelCase)
    meetingId: dbTask.meeting_id,
    phaseId: dbTask.phase_id,

    // JSON fields
    links: dbTask.links,

    // Timestamps
    createdAt: dbTask.created_at,
    updatedAt: dbTask.updated_at,
  };
}
```

## Data Model Patterns

### Database Field Naming Convention

- **Database**: snake_case (meeting_id, created_at, phase_number)
- **API/TypeScript**: camelCase (meetingId, createdAt, phaseNumber)
- **Domain models handle the transformation between conventions**

### Core Entity Relationships

```typescript
// Primary relationships in the system
Client (1) ──→ (N) Meeting
Meeting (1) ──→ (N) Phase
Phase (1) ──→ (N) Task
Meeting (1) ──→ (N) Position
Meeting (1) ──→ (N) Proposal
Position (1) ──→ (N) PositionVote
Proposal (1) ──→ (N) PositionVote
Meeting (1) ──→ (N) Document
Task (0..1) ──→ (0..1) Document
```

### Field Transformation Patterns

```typescript
// Standard transformation pattern for all domain models
export function transformEntity(dbEntity: DatabaseRow): ApiEntity {
  return {
    // 1. Direct mappings (same name)
    id: dbEntity.id,
    title: dbEntity.title,
    status: dbEntity.status,

    // 2. Foreign key mappings (snake_case → camelCase)
    meetingId: dbEntity.meeting_id,
    userId: dbEntity.user_id,

    // 3. Date field mappings
    createdAt: dbEntity.created_at,
    updatedAt: dbEntity.updated_at,
    dueDate: dbEntity.due_date,

    // 4. JSON field mappings (parsed automatically by Supabase)
    links: dbEntity.links,
    metadata: dbEntity.metadata,

    // 5. Computed/derived fields
    displayName: `${dbEntity.first_name} ${dbEntity.last_name}`,
  };
}
```

## API Response Patterns

### Standard Response Format

```typescript
// All domain model functions return this format
type ApiResponse<T> = {
  data?: T;
  error?: {
    message: string;
    statusCode?: number;
  };
};

// Implementation pattern
export async function listTasks(meetingId: string): Promise<ApiResponse<Task[]>> {
  try {
    const { data, error } = await supabase
      .from("task")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("created_at", { ascending: false });

    if (error) {
      return { error: { message: error.message, statusCode: 500 } };
    }

    return { data: data.map(transformTask) };
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
        statusCode: 500,
      },
    };
  }
}
```

### Query Patterns

```typescript
// 1. Simple list with filtering
const { data, error } = await supabase
  .from("task")
  .select("*")
  .eq("meeting_id", meetingId)
  .in("status", ["PENDING", "IN_PROGRESS"])
  .order("due_date", { ascending: true });

// 2. Join queries for related data
const { data, error } = await supabase
  .from("meeting")
  .select(
    `
    *,
    phases:phase(*),
    tasks:task(*),
    documents:document(*)
  `,
  )
  .eq("id", meetingId)
  .single();

// 3. Aggregation queries
const { data, error } = await supabase
  .from("position_vote")
  .select("vote, shares_voting.sum()")
  .eq("proposal_id", proposalId)
  .group("vote");
```

## Seed Data Patterns

### Deterministic Data Generation

```typescript
// File: supabase/seed.ts
import { copycat } from "@snaplet/copycat";

// Use copycat for consistent, realistic test data
const clients = Array.from({ length: 4 }, (_, i) => ({
  id: copycat.uuid(i),
  ticker: copycat.word(i).slice(0, 4).toUpperCase(),
  company_name: copycat.companyName(i),
  industry: copycat.oneOf(i, ["Technology", "Healthcare", "Finance"]),
  created_at: copycat.dateRecent(i).toISOString(),
}));

// Generate related data with foreign key relationships
const meetings = clients.flatMap((client, clientIndex) =>
  Array.from({ length: 3 }, (_, meetingIndex) => {
    const seedValue = clientIndex * 100 + meetingIndex;
    return {
      id: `${client.ticker.toLowerCase()}-annual-meeting-${2023 + meetingIndex}`,
      ticker: client.ticker,
      title: `${client.company_name} Annual Meeting ${2023 + meetingIndex}`,
      meeting_date: copycat.dateRecent(seedValue).toISOString(),
      status: copycat.oneOf(seedValue, ["PLANNING", "ACTIVE", "COMPLETED"]),
      // ... other fields
    };
  }),
);
```

### Task Link Generation

```typescript
// Generate task links based on task type and title
function generateTaskLinks(title: string, type: string): TaskLink[] {
  const links: TaskLink[] = [];

  // Broadridge ICC Access tasks get specific links
  if (title.includes("Broadridge") && title.includes("Access")) {
    links.push({
      label: "Download Form",
      action: "download",
      url: "",
    });
    links.push({
      label: "Sign Form",
      action: "signature",
      url: "",
    });
  }

  // Document preparation tasks
  if (type === "document" || title.includes("Document")) {
    links.push({
      label: "Upload Document",
      action: "upload",
      url: "",
    });
  }

  return links;
}
```

## Database Migration Patterns

### Migration File Structure

```sql
-- File: supabase/migrations/YYYYMMDDHHMMSS_description.sql

-- 1. Create enums first
CREATE TYPE task_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE');

-- 2. Create tables with proper constraints
CREATE TABLE task (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id TEXT NOT NULL REFERENCES meeting(id),
  phase_id UUID REFERENCES phase(id),
  title TEXT NOT NULL CHECK (length(title) >= 3),
  status task_status DEFAULT 'PENDING',
  links JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX idx_task_meeting_id ON task(meeting_id);
CREATE INDEX idx_task_status ON task(status);
CREATE INDEX idx_task_due_date ON task(due_date);

-- 4. Create composite indexes for common queries
CREATE UNIQUE INDEX idx_task_meeting_phase ON task(meeting_id, phase_id, title);
```

### Common Migration Patterns

```sql
-- Add new column with default
ALTER TABLE task ADD COLUMN priority TEXT DEFAULT 'MEDIUM';

-- Add enum constraint
ALTER TABLE task ADD CONSTRAINT task_priority_check
  CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'));

-- Add foreign key relationship
ALTER TABLE task ADD COLUMN document_id UUID REFERENCES document(id);

-- Update existing data
UPDATE task SET priority = 'HIGH' WHERE due_date < NOW() + INTERVAL '1 day';
```

## Frontend Data Integration

### SWR Hook Patterns

```typescript
// File: issuer-portal/hooks/useTasks.ts
import useSWR from "swr";

import { apiClient } from "@/domain-models/apiClient";

export function useTasks(meetingId: string, phaseId?: string) {
  const { data, error, mutate } = useSWR(
    meetingId ? ["tasks", meetingId, phaseId] : null,
    async () => {
      const { data, error } = await apiClient.GET("/meetings/{meetingId}/tasks", {
        params: {
          path: { meetingId },
          query: phaseId ? { phaseId } : {},
        },
      });

      if (error) throw new Error("Failed to fetch tasks");
      return data;
    },
  );

  return {
    tasks: data,
    isLoading: !error && !data,
    error,
    mutate,
  };
}
```

### Type-Safe API Client Usage

```typescript
// File: issuer-portal/domain-models/apiClient.ts
import createClient from "openapi-fetch";

import type { paths } from "./generated-schema";

export const apiClient = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
});

// Usage in components
const { data: tasks } = await apiClient.GET("/meetings/{meetingId}/tasks", {
  params: {
    path: { meetingId: "meeting-123" },
    query: { status: "INCOMPLETE", phaseId: "phase-1" },
  },
});
// tasks is automatically typed as Task[]
```

## Error Handling Patterns

### Database Error Handling

```typescript
// Handle Supabase errors consistently
export async function createTask(taskData: CreateTaskRequest): Promise<ApiResponse<Task>> {
  try {
    const { data, error } = await supabase
      .from("task")
      .insert({
        meeting_id: taskData.meetingId,
        title: taskData.title,
        // ... other fields
      })
      .select()
      .single();

    if (error) {
      // Handle specific error types
      if (error.code === "23505") {
        // Unique violation
        return {
          error: { message: "Task with this title already exists", statusCode: 409 },
        };
      }
      if (error.code === "23503") {
        // Foreign key violation
        return { error: { message: "Invalid meeting or phase ID", statusCode: 400 } };
      }

      return { error: { message: error.message, statusCode: 500 } };
    }

    return { data: transformTask(data) };
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
        statusCode: 500,
      },
    };
  }
}
```

## Performance Optimization

### Database Query Optimization

```typescript
// 1. Use select() to limit returned columns
const { data } = await supabase
  .from("task")
  .select("id, title, status, due_date") // Only needed columns
  .eq("meeting_id", meetingId);

// 2. Use pagination for large datasets
const { data } = await supabase
  .from("position")
  .select("*")
  .eq("meeting_id", meetingId)
  .range(0, 49) // First 50 records
  .order("created_at", { ascending: false });

// 3. Use joins instead of multiple queries
const { data } = await supabase
  .from("meeting")
  .select(
    `
    id,
    title,
    status,
    tasks:task(id, title, status),
    phases:phase(id, name, status)
  `,
  )
  .eq("id", meetingId)
  .single();
```

### Frontend Caching Strategy

```typescript
// Use SWR with appropriate cache keys and revalidation
const { data: meeting } = useSWR(["meeting", meetingId], () => fetchMeeting(meetingId), {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 60000, // 1 minute
});
```

## Critical Rules

1. **Never bypass the schema-driven workflow** - always update OpenAPI first
2. **Always update domain model transformations** when adding OpenAPI fields
3. **Use consistent error handling patterns** across all domain models
4. **Follow snake_case → camelCase transformation** in domain models
5. **Generate deterministic seed data** using copycat with consistent seed values
6. **Create proper database indexes** for all foreign keys and frequently queried fields
7. **Use type-safe API calls** with openapi-fetch and generated types
8. **Handle Supabase errors specifically** by error code when possible
