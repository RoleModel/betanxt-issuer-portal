# BetaNXT Issuer Portal Mock API Server

## Test User Credentials

| Username     | Password       | Type          | Description                                                  |
| ------------ | -------------- | ------------- | ------------------------------------------------------------ |
| `dev.user`   | `ju$Ky8Ad1#%g` | ADMIN         | Development admin - access to all clients                    |
| `test.user`  | `9yUDDftg@Lh!` | ADMIN         | Test admin                                                   |
| `mike`       | `password`     | ISSUER        | Wendy's (WEN) issuer user                                    |
| `lisa`       | `password`     | ISSUER        | Paycom (PAYC) issuer user                                    |
| `david`      | `password`     | ISSUER        | Woodward (WWD) issuer user                                   |
| `jenny`      | `password`     | ISSUER        | Enliven (ELVN) issuer user                                   |
| `dfin.admin` | `DfinP@ss1`    | PARENT_CLIENT | DFIN parent client - events overview dashboard               |
| `morrow`     | `MrwSdl@1`     | SOLICITOR     | Morrow & Co. solicitor - events overview dashboard           |
| `csm.user`   | `CsmP@ss1`     | CSM           | Client Service Manager - events overview with mailing status |

## Overview

The **BetaNXT Issuer Portal Mock API Server** is a fully-functional API implementation that serves as both a development backend for the [Issuer Portal](../issuer-portal/README.md) frontend application and a testing foundation for end-to-end tests.

## Purpose

This mock API server was created to enable frontend development before the production backend was available. It provides:

- **Complete API Implementation**: Full REST API matching the production schema
- **Deterministic Testing**: Consistent seed data for reliable E2E testing
- **Schema-Driven Development**: OpenAPI specification drives all code generation
- **Type Safety**: Full TypeScript types generated from OpenAPI spec
- **Real Database**: Supabase PostgreSQL for authentic data relationships

## Architecture

The API server follows a **schema-first** approach where the OpenAPI specification is the single source of truth for all generated code:

```
OpenAPI Spec → Database Schema → API Types → Domain Models → Next.js Routes
```

# Schema-Driven Development Workflow

## The Complete Flow

### 1. OpenAPI Specification (Source of Truth)

All API development starts with the OpenAPI specification file:

```yaml
# openapi-schema/openapi.yaml
paths:
  /meetings/{meetingId}/tasks:
    get:
      operationId: listTasks
      parameters:
        - name: meetingId
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Task"
```

### 2. Database Schema Generation

From the OpenAPI spec, PostgreSQL database schemas are automatically generated:

```bash
# Generate PostgreSQL schema from OpenAPI
npm run generate:postgres-schema
```

This creates:

- **Tables**: Based on schema components
- **Relationships**: Foreign keys from component references
- **Types**: PostgreSQL enums and custom types
- **Constraints**: Validation rules from schema definitions

**Output**: `supabase/migrations/postgresql_schema.sql`

### 3. TypeScript Type Generation

TypeScript types are generated for both API and database layers:

```bash
# Generate API types from OpenAPI
npm run generate:api-types

# Generate database types from Supabase
npm run generate:db-types
```

**Outputs**:

- `types/api.ts` - OpenAPI-generated types for request/response models
- `utils/supabase/database.types.ts` - Supabase-generated database types

### 4. Domain Models (Manual Implementation)

Domain models provide the business logic layer between the database and API routes. **Unlike types and routes, domain models are manually implemented** to allow for:

- **Custom business logic** (validation, computed fields, side effects)
- **Field transformations** (snake_case ↔ camelCase mapping)
- **Error handling** (consistent error response format)
- **Database optimization** (custom queries, joins, transactions)

```typescript
// domain-models/api/tasks.ts
import type { components } from "@/types/api";
import { supabase } from "@/utils/supabase/client";

type Task = components["schemas"]["Task"];

// Manual field mapping ensures all OpenAPI fields are included
function transformTask(dbTask: any): Task {
  return {
    // Core fields
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description,

    // Foreign keys (snake_case → camelCase)
    meetingId: dbTask.meeting_id,
    phaseId: dbTask.phase_id,
    documentId: dbTask.document_id,

    // JSON fields (parsed automatically by Supabase)
    links: dbTask.links,

    // Metadata
    owner: dbTask.owner,
    status: dbTask.status,
    type: dbTask.type,
    dueDate: dbTask.due_date,
    phaseNumber: dbTask.phase_number,

    // Timestamps
    createdAt: dbTask.created_at,
    updatedAt: dbTask.updated_at,
  };
}

export async function listTasks(meetingId: string): Promise<ApiResponse<Task[]>> {
  const { data, error } = await supabase.from("task").select("*").eq("meeting_id", meetingId);

  if (error) {
    return { error: { message: error.message, statusCode: 500 } };
  }

  return { data: data.map(transformTask) };
}
```

**Key Principle**: When adding new fields to the OpenAPI schema:

1. ✅ Update OpenAPI specification
2. ✅ Regenerate database schema and types
3. ✅ **Manually update domain model transformations**
4. ✅ Add field mappings in create/update functions

### 5. Auto-Generated API Routes

Next.js API routes are automatically generated from the OpenAPI specification:

```typescript
// app/api/meetings/[meetingId]/tasks/route.ts (AUTO-GENERATED)
import { listTasks } from "@/domain-models/api/tasks";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> },
): Promise<NextResponse> {
  const { meetingId } = await params;
  const { data, error } = await listTasks(meetingId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

### 6. Frontend Integration with openapi-fetch

The frontend uses `openapi-fetch` for type-safe API calls:

```typescript
// Frontend usage (issuer-portal)
import createClient from "openapi-fetch";

import type { paths } from "@/domain-models/generated-schema";

const client = createClient<paths>({ baseUrl: "http://localhost:3001" });

// Fully type-safe API calls
const { data, error } = await client.GET("/meetings/{meetingId}/tasks", {
  params: {
    path: { meetingId: "meeting-123" },
    query: { status: "INCOMPLETE" },
  },
});

// data is typed as Task[] automatically
```

## Key Benefits

### 🔄 **Single Source of Truth**

- OpenAPI spec defines both API contracts and database schema
- Changes in one place propagate everywhere automatically
- No schema drift between frontend, backend, and database

### 🛡️ **Full Type Safety**

- Compile-time validation of API calls
- TypeScript types generated from authoritative source
- Eliminates runtime type errors

### ⚡ **Rapid Development**

- New endpoints: Update OpenAPI → regenerate → done
- Automatic route generation eliminates boilerplate
- Seed data generation creates realistic test scenarios

### 🧪 **Reliable Testing**

- Deterministic seed data for consistent test results
- Schema validation ensures API compliance
- Integration tests verify full request/response cycle

# Development Commands

## Schema-Driven Development Workflow

**IMPORTANT**: Always follow this exact sequence when making API changes:

```bash
# 1. Update OpenAPI specification
nano openapi-schema/openapi.yaml

# 2. Generate PostgreSQL schema from OpenAPI
npm run generate:postgres-schema

# 3. Generate fresh seed data
npm run generate:seeds

# 4. Reset database with new schema and seeds
supabase db reset

# 5. Generate TypeScript types
npm run generate:db-types
npm run generate:api-types

# 6. Regenerate API routes (if needed)
npm run generate:routes
```

## Available Scripts

### Code Generation

- `npm run generate:postgres-schema` - Generate PostgreSQL schema from OpenAPI
- `npm run generate:seeds` - Generate TypeScript seed data
- `npm run generate:db-types` - Generate database types from Supabase
- `npm run generate:api-types` - Generate API types from OpenAPI
- `npm run full-reset` - Complete regeneration: schema → seeds → database → types

### Database Operations

- `npm run supabase:start` - Start local Supabase instance
- `npm run supabase:stop` - Stop local Supabase instance
- `npm run supabase:reset` - Reset database with migrations and seeds
- `npm run seed` - Apply seed data to database
- `npm run seed:validate` - Validate seed data integrity

# How to set up the project

## How to start the dev server

- start the dev server - `npm run dev`

## How to generate the test build

- build the app - `npm run build:test`
- run the build - `npm run start:test`

## How to generate the production build

- build the app - `npm run build`
- run the build - `npm run start`

## How to run tests

- run all tests - `npx playwright test`
- run tests with UI - `npx playwright test --ui`
- run specific test - `npx playwright test tests/integration/test_api_comprehensive.spec.ts`

# Supabase

- This API uses [Supabase](https://supabase.com/docs) as its database.

## Local development with Supabase

1. `npx supabase start` - Starts the local Supabase client
2. [Ensure local db is up to date with the remote db](./README.md#update-schema-from-remote-db)
3. Status of local db can be run with `npx supabase status`. From here the local database studio can be launched to manage the database

## Update schema from remote db

1. `npx supabase start` - execute if you have not done so already
2. `npx supabase link --project-ref <project-id>` - You can get `<project-id>` from your project's dashboard URL: `https://supabase.com/dashboard/project/<project-id>`
3. `npx supabase db pull` - Capture any changes that you have made to your remote database before you went through the steps above, if you have not made any changes to the remote database, skip this step
4. `npx supabase migration up` - To apply the new migration to your local database
5. `npx supabase db reset` - To reset your local database completely
6. `npm run seed` - If pulling down or making new changes to the db you will need to reseed the database

## Editing your local db

- `npx supabase status` will display various dev tools available for the db
- select `Studio URL` from this list to launch the local Supabase UI

## Generate a db migration file

- When changing the structure of the database, you must generate a migration file in order to apply your changes.
- Once you have made your change to your local database run `supabase db diff -f my_migration_name` where my_migration_name describes the changes you made
- This will generate a migration file in `supabase/migrations/`. Look over the generated file and make changes if necessary
- Reset your database by running `npx supabase db reset` to apply all migrations including your new one

## Seeding approach

We are using custom TypeScript seed files to generate our seed data to populate Supabase locally for both testing and local development. This process allows us to create data that is fully deterministic.

## Generating seed data

1. Make any necessary database changes (i.e adding a new column)
2. Create or modify the data generation in [seed.ts](./seed.ts)
3. Run `npm run seed` to populate the database with seed data
4. Run `npx supabase db reset` to reset the local database and apply fresh seeds

## Environment Setup

1. Copy `env.template` to `.env.development.local`
2. Fill in your Supabase credentials:
   ```
   # Supabase
   SUPABASE_URL="https://your-project.supabase.co"
   SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

## Email System

The mock API server includes a local email system for previewing and testing transactional emails without depending on the production backend. Email templates are built with React Email, rendered on the server, and sent through a pluggable provider selected by environment variables.

### How the flow works

```text
Email preview UI or frontend feature
  -> POST /api/emails/send
  -> validate payload with the template-specific Zod schema
  -> find the React Email template in TEMPLATE_REGISTRY
  -> build the email subject from the template payload
  -> getEmailService selects noop, Resend, or SMTP
  -> render HTML and plain text with @react-email/render
  -> provider sends the message or writes a local preview file
```

The main send endpoint is `POST /api/emails/send`. It is intentionally disabled unless `ENABLE_EMAILS=true` is set, so local development cannot accidentally send messages.

### Templates

| Template key                   | Component                               | Purpose                                                      |
| ------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `document-update-notification` | `emails/DocumentUpdateNotification.tsx` | Notifies an issuer account when a workflow document changes. |
| `tabulation-daily-report`      | `emails/TabulationReportEmail.tsx`      | Sends a daily tabulation progress summary before a meeting.  |

Each template has:

- Props defined in `emails/types.ts`
- Runtime validation in `app/api/emails/send/route.ts`
- Preview fixture data in `app/api/emails/preview/route.ts`
- Shared layout, header, footer, logo, and style primitives under `emails/components/`

### Local preview

Use the built-in preview page while the mock API server is running:

```bash
npm run dev
```

Then open:

```text
http://localhost:3001/email-preview
```

The preview UI renders fixture data through `GET /api/emails/preview?template={templateKey}` and can send a test email through `POST /api/emails/send`.

You can also run the standalone React Email preview server:

```bash
cd mock-api-server
npm run email:dev
```

This opens the React Email preview app on `http://localhost:3030`.

### Provider modes

The provider is selected in `lib/email/EmailService.ts`.

| Mode     | Required environment variables                                    | Behavior                                                                  |
| -------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `noop`   | None                                                              | Local fallback. Renders HTML to a temp file and logs a preview URL.       |
| `resend` | `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM`           | Sends with Resend using rendered HTML and plain-text output.              |
| `smtp`   | `EMAIL_PROVIDER=smtp`, `EMAIL_SMTP_HOST`, SMTP auth, `EMAIL_FROM` | Sends with Nodemailer and verifies the SMTP connection on initialization. |

Example `.env.local` for SMTP/Gmail:

```bash
ENABLE_EMAILS=true
EMAIL_PROVIDER=smtp
EMAIL_FROM="BetaNXT Issuer Portal <noreply@betanxt.com>"
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
EMAIL_SMTP_USER=your-smtp-user
EMAIL_SMTP_PASS=your-smtp-password
PORTAL_BASE_URL=https://your-portal.example.com
```

For Gmail SMTP, `EMAIL_FROM` should use the same address as `EMAIL_SMTP_USER`, or a Gmail/Google Workspace alias that the authenticated account is explicitly allowed to send from. Gmail may rewrite or reject messages when the `From` address is not authorized for the SMTP account.

For local development, if `EMAIL_PROVIDER` is missing, unsupported, or missing its required credentials, the server falls back to noop mode. Noop mode still returns an id that starts with `noop-`, but no external email is sent.

For Vercel deployments, `ENABLE_EMAILS=true` requires a real provider configuration. If email sending is enabled on Vercel but the provider or credentials are missing, the API returns a clear provider configuration error instead of silently returning a noop id.

### Vercel deployment checklist

Use the same Gmail SMTP provider in Vercel that is used locally.

Set these environment variables on the Vercel project that deploys `mock-api-server`:

- `ENABLE_EMAILS=true`
- `EMAIL_PROVIDER=smtp`
- `EMAIL_FROM` using the same Gmail account as `EMAIL_SMTP_USER`, or an authorized Gmail/Workspace send-as alias
- `EMAIL_SMTP_HOST=smtp.gmail.com`
- `EMAIL_SMTP_PORT=587`
- `EMAIL_SMTP_SECURE=false`
- `EMAIL_SMTP_USER`
- `EMAIL_SMTP_PASS`
- `PORTAL_BASE_URL`
- `CRON_SECRET` if using the scheduled tabulation distribution cron

The cron job in `vercel.json` calls `GET /api/cron/tabulation-distribute` daily at 8:00 UTC. The route also supports `POST` for the manual send-now flow in the issuer portal.

### Send API shape

```http
POST /api/emails/send
Content-Type: application/json
```

```json
{
  "templateKey": "document-update-notification",
  "to": ["issuer@example.com"],
  "props": {
    "meetingType": "Annual Meeting",
    "issuerAccountName": "Wendy's",
    "documentName": "Proxy Notice",
    "uploaderName": "Sarah Chen",
    "documentDescription": "Sarah Chen has uploaded the first draft of the Proxy Notice.",
    "uploadDate": "2026-06-02T12:00:00.000Z",
    "viewDocumentUrl": "http://localhost:3000/WEN/meeting/wen-annual-meeting-2026/documents",
    "portalBaseUrl": "http://localhost:3000"
  }
}
```

Successful responses return:

```json
{
  "data": {
    "id": "provider-message-id"
  }
}
```

Validation failures return `400`, disabled sending returns `503`, and provider failures return `500` with the provider error message.

### Adding a template

1. Create the React Email component under `emails/`.
2. Add its prop interface to `emails/types.ts`.
3. Add a template-specific Zod schema to `app/api/emails/send/route.ts`.
4. Register the template in `TEMPLATE_REGISTRY`.
5. Add subject handling in `buildSubject`.
6. Add fixture props and preview routing in `app/api/emails/preview/route.ts`.
7. Add the template option to `app/email-preview/EmailPreviewClient.tsx`.

See `emails/README.md` for template-specific notes.

# API Documentation

## Core Endpoints

All endpoints follow RESTful conventions and return JSON responses. Authentication is handled via request headers (in production).

### 🏢 **Client & Account Management**

```typescript
// Get all clients
GET / api / client;
// Response: Client[]

// Get client by ticker
GET / api / client / { ticker };
// Response: Client

// List accounts
GET / api / accounts;
// Response: Account[]

// Get account with users
GET / api / accounts / { accountId };
GET / api / accounts / { accountId } / users;
```

### 📋 **Meeting Management**

```typescript
// List meetings with filters
GET /api/meetings?status=ACTIVE&year=2025
// Response: Meeting[]

// Get meeting details
GET /api/meetings/{meetingId}
// Response: Meeting

// Create meeting
POST /api/meetings
// Body: CreateMeetingRequest
// Response: Meeting

// Update meeting
PUT /api/meetings/{meetingId}
// Body: UpdateMeetingRequest
// Response: Meeting
```

### ✅ **Task Management**

```typescript
// List tasks for a meeting
GET /api/meetings/{meetingId}/tasks?phaseId={phaseId}&status=INCOMPLETE
// Response: Task[]

// Get specific task
GET /api/tasks/{taskId}
// Response: Task

// Create task
POST /api/meetings/{meetingId}/tasks
// Body: CreateTaskRequest
// Response: Task

// Update task (including links)
PUT /api/tasks/{taskId}
// Body: UpdateTaskRequest
// Response: Task
```

**Task Links Structure**:

```json
{
  "id": "task-123",
  "title": "Broadridge ICC Access",
  "links": [
    {
      "label": "Download Form",
      "action": "download",
      "url": ""
    },
    {
      "label": "Sign Form",
      "action": "signature",
      "url": ""
    }
  ]
}
```

### 📄 **Document Management**

```typescript
// List documents for meeting
GET /api/meetings/{meetingId}/documents?status=DRAFT&type=PROXY
// Response: Document[]

// Get document details
GET /api/documents/{documentId}
// Response: Document

// Download document
GET /api/documents/{documentId}/download
// Response: File stream

// Document comments
GET /api/documents/{documentId}/comments
POST /api/documents/{documentId}/comments
```

### 🗳️ **Voting & Positions**

```typescript
// List positions
GET /api/positions?meetingId={meetingId}
// Response: Position[]

// Get position with votes
GET /api/positions/{positionId}
// Response: Position

// List proposals for meeting
GET /api/meetings/{meetingId}/proposals
// Response: Proposal[]

// Cast votes
POST /api/position_votes
// Body: CastVoteRequest[]
// Response: PositionVote[]
```

### 🔔 **Notifications**

```typescript
// Get user notifications
GET / api / notifications;
// Response: Notification[]

// Mark notification as read
POST / api / notifications / { notificationId } / mark - read;
// Response: Notification
```

### 🏗️ **Meeting Structure**

```typescript
// List phases for meeting
GET / api / meetings / { meetingId } / phases;
// Response: Phase[]

// Get phase details
GET / api / phases / { phaseId };
// Response: Phase
```

## Domain Models Architecture

### Core Business Entities

#### **Client → Account → User Hierarchy**

```
Client (Company)
├── Account (Department/Division)
│   ├── User (Individual with roles)
│   └── User (ADMIN, ISSUER, RELATIONSHIP_MANAGER)
└── Meetings (Shareholder events)
```

#### **Meeting Workflow Structure**

```
Meeting
├── Phases (1-8: Planning → Execution → Closing)
│   ├── Tasks (Action items with links)
│   │   ├── Links (download, signature, upload, authorize)
│   │   └── Documents (Attachments)
│   └── Completion tracking
├── Proposals (Voting items)
└── Documents (Meeting materials)
```

#### **Voting System**

```
Position (Shareholder holding)
├── PositionVote (Vote on specific proposal)
│   ├── Vote: FOR/AGAINST/ABSTAIN
│   └── Shares: Number of shares
└── Meeting linkage
```

### Field Mappings & Transformations

The domain models handle transformation between database snake_case and API camelCase:

```typescript
// Database → API transformation
function transformTask(dbTask: DatabaseTask): Task {
  return {
    // ID and core fields
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description,

    // Foreign keys
    meetingId: dbTask.meeting_id,
    phaseId: dbTask.phase_id,
    documentId: dbTask.document_id,

    // Metadata
    phaseNumber: dbTask.phase_number,
    dueDate: dbTask.due_date,
    owner: dbTask.owner,
    status: dbTask.status,
    type: dbTask.type,

    // JSON fields
    links: dbTask.links, // Parsed automatically by Supabase

    // Timestamps
    createdAt: dbTask.created_at,
    updatedAt: dbTask.updated_at,
  };
}
```

### Error Handling

All domain models return a consistent error format:

```typescript
type ApiResponse<T> = {
  data?: T;
  error?: {
    message: string;
    statusCode?: number;
  };
};

// Usage in domain models
export async function listTasks(meetingId: string): Promise<ApiResponse<Task[]>> {
  try {
    const { data, error } = await supabase.from("task").select("*").eq("meeting_id", meetingId);

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

## Frontend Integration Patterns

### Type-Safe API Calls with openapi-fetch

```typescript
// 1. Import generated types
import createClient from "openapi-fetch";

import type { paths } from "@/domain-models/generated-schema";

// 2. Create client with base URL
const client = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
});

// 3. Make type-safe requests
const { data, error } = await client.GET("/meetings/{meetingId}/tasks", {
  params: {
    path: { meetingId },
    query: {
      phaseId: "phase-1",
      status: "INCOMPLETE",
    },
  },
});

// data is automatically typed as Task[]
if (data) {
  data.forEach((task) => {
    console.log(task.title); // TypeScript knows this exists
    console.log(task.links); // TypeScript knows this is TaskLink[]
  });
}
```

### React Query Integration

```typescript
// Custom hook for tasks
export function useTasks(meetingId: string, phaseId?: string) {
  return useQuery({
    queryKey: ['tasks', meetingId, phaseId],
    queryFn: async () => {
      const { data, error } = await client.GET('/meetings/{meetingId}/tasks', {
        params: {
          path: { meetingId },
          query: phaseId ? { phaseId } : {}
        }
      })

      if (error) throw new Error(error.message)
      return data
    }
  })
}

// Usage in component
function TaskList({ meetingId }: { meetingId: string }) {
  const { data: tasks, isLoading, error } = useTasks(meetingId)

  if (isLoading) return <Spinner />
  if (error) return <ErrorMessage error={error} />

  return (
    <div>
      {tasks?.map(task => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  )
}
```

### Mutation Examples

```typescript
// Update task with links
const updateTask = useMutation({
  mutationFn: async (params: { taskId: string; updates: UpdateTaskRequest }) => {
    const { data, error } = await client.PUT("/tasks/{id}", {
      params: { path: { id: params.taskId } },
      body: params.updates,
    });

    if (error) throw new Error(error.message);
    return data;
  },
  onSuccess: () => {
    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  },
});

// Usage
updateTask.mutate({
  taskId: "task-123",
  updates: {
    status: "COMPLETE",
    links: [{ label: "Download Report", action: "download", url: "/reports/final.pdf" }],
  },
});
```

# Seed Data System

## Deterministic Data Generation

The seed system uses **Snaplet Copycat** to generate consistent, realistic test data:

```typescript
// supabase/seed.ts
import { copycat } from "@snaplet/copycat";

// Generate consistent data based on seed value
const clients = Array.from({ length: 4 }, (_, i) => ({
  id: copycat.uuid(i),
  ticker: copycat.word(i).slice(0, 4).toUpperCase(),
  company_name: copycat.companyName(i),
  industry: copycat.oneOf(i, ["Technology", "Healthcare", "Finance"]),
  created_at: copycat.dateRecent(i).toISOString(),
}));

// Generate task links for specific scenarios
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

  return links;
}
```

### Seed Data Categories

- **Base Entities**: Clients, accounts, users with realistic relationships
- **Meeting Data**: Multiple years of meeting history per client
- **Task Workflows**: Phase-appropriate tasks with action links
- **Voting Scenarios**: Positions, proposals, and vote distributions
- **Document Trails**: Meeting materials with status tracking

## Testing Framework

### Comprehensive Test Coverage

```typescript
// tests/integration/test_api_comprehensive.spec.ts
import { expect, test } from "@playwright/test";

test.describe("Task Management API", () => {
  test("should list tasks with links", async ({ request }) => {
    const response = await request.get("/api/meetings/wen-annual-meeting-2025/tasks");
    expect(response.ok()).toBeTruthy();

    const tasks = await response.json();
    const broadridgeTask = tasks.find((t) => t.title.includes("Broadridge"));

    expect(broadridgeTask).toBeDefined();
    expect(broadridgeTask.links).toHaveLength(2);
    expect(broadridgeTask.links[0].action).toBe("download");
    expect(broadridgeTask.links[1].action).toBe("signature");
  });

  test("should update task links", async ({ request }) => {
    const updateResponse = await request.put("/api/tasks/task-123", {
      data: {
        links: [{ label: "New Link", action: "external", url: "https://example.com" }],
      },
    });

    expect(updateResponse.ok()).toBeTruthy();
    const updatedTask = await updateResponse.json();
    expect(updatedTask.links).toHaveLength(1);
  });
});
```

### Database Schema Testing

```typescript
test.describe("Database Schema Validation", () => {
  test("should maintain referential integrity", async ({ request }) => {
    // Test foreign key constraints
    const invalidTask = await request.post("/api/meetings/invalid-id/tasks", {
      data: { title: "Test Task", phaseId: "nonexistent-phase" },
    });

    expect(invalidTask.status()).toBe(400);
  });

  test("should validate enum constraints", async ({ request }) => {
    const invalidStatus = await request.put("/api/tasks/task-123", {
      data: { status: "INVALID_STATUS" },
    });

    expect(invalidStatus.status()).toBe(400);
  });
});
```

# Advanced Patterns

## Custom Domain Logic

### Business Rule Implementation

```typescript
// domain-models/api/tasks.ts
export async function completeTask(taskId: string): Promise<ApiResponse<Task>> {
  // Business logic: Auto-complete phase when all tasks done
  const task = await getTaskById(taskId);
  if (!task.data) return { error: { message: "Task not found" } };

  // Update task status
  const updatedTask = await updateTask(taskId, { status: "COMPLETE" });

  // Check if phase is complete
  const phaseTasks = await listTasks(task.data.meetingId, {
    phaseId: task.data.phaseId,
  });

  const allComplete = phaseTasks.data?.every((t) => t.status === "COMPLETE");
  if (allComplete) {
    await updatePhase(task.data.phaseId, { status: "COMPLETE" });
  }

  return updatedTask;
}
```

### Transaction Management

```typescript
// domain-models/api/voting.ts
export async function castVotes(votes: CastVoteRequest[]): Promise<ApiResponse<PositionVote[]>> {
  const { data, error } = await supabase.rpc("cast_votes_transaction", {
    votes_data: votes,
  });

  // PostgreSQL function handles atomicity
  if (error) return { error: { message: error.message } };
  return { data: data.map(transformPositionVote) };
}
```

## Performance Optimization

### Query Optimization

```typescript
// Efficient nested queries with joins
export async function getMeetingWithDetails(meetingId: string) {
  const { data, error } = await supabase
    .from("meeting")
    .select(
      `
      *,
      phases:phase(*),
      tasks:task(*),
      proposals:proposal(*),
      documents:document(*)
    `,
    )
    .eq("id", meetingId)
    .single();

  return { data: transformMeetingWithDetails(data) };
}

// Pagination with cursor-based approach
export async function listMeetingsPaginated(cursor?: string, limit = 20) {
  let query = supabase
    .from("meeting")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;
  return { data: data?.map(transformMeeting) };
}
```

### Caching Strategy

```typescript
// domain-models/api/cache.ts
const cache = new Map<string, { data: any; expiry: number }>();

export function withCache<T>(key: string, ttl: number) {
  return function (fn: () => Promise<T>) {
    return async (): Promise<T> => {
      const cached = cache.get(key);
      if (cached && Date.now() < cached.expiry) {
        return cached.data;
      }

      const result = await fn();
      cache.set(key, { data: result, expiry: Date.now() + ttl });
      return result;
    };
  };
}

// Usage
export const getCachedClients = withCache(
  "clients",
  5 * 60 * 1000,
)(() => supabase.from("clients").select("*"));
```

# Troubleshooting Guide

## Common Issues

### 1. **Task Links Not Appearing**

**Symptoms**: TaskDrawer shows empty links array
**Cause**: Missing field mapping in domain model transformation
**Solution**:

```typescript
// Ensure transformTask includes links field
function transformTask(dbTask: any): Task {
  return {
    // ... other fields
    links: dbTask.links, // ← Must be included
  };
}
```

### 2. **Type Mismatches**

**Symptoms**: TypeScript errors with openapi-fetch calls
**Cause**: Outdated generated types
**Solution**:

```bash
# Regenerate all types
npm run generate:api-types
npm run generate:db-types
```

### 3. **Database Connection Errors**

**Symptoms**: Supabase client connection failures
**Cause**: Environment variables or local Supabase not running
**Solution**:

```bash
# Check Supabase status
npx supabase status

# Restart if needed
npx supabase stop
npx supabase start
```

### 4. **Schema Drift**

**Symptoms**: Database and API types out of sync
**Cause**: Manual schema changes without regeneration
**Solution**:

```bash
# Full reset workflow
npm run generate:postgres-schema
npm run generate:seeds
supabase db reset
npm run generate:db-types
npm run generate:api-types
```

## Best Practices

### ✅ **DO**

- **Always follow schema-driven workflow**: OpenAPI → Schema → Types
- **Use transaction functions** for multi-table operations
- **Implement proper error handling** in domain models
- **Write integration tests** for new endpoints
- **Validate input parameters** in domain functions
- **Use TypeScript strict mode** for maximum type safety

### ❌ **DON'T**

- **Don't manually edit generated files** (types, routes, schema)
- **Don't bypass domain models** in API routes
- **Don't forget field mappings** in transform functions
- **Don't skip database resets** after schema changes
- **Don't hardcode business logic** in API routes

## Performance Monitoring

### Database Query Analysis

```sql
-- Monitor slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE tablename IN ('task', 'meeting', 'position');
```

### API Response Times

```typescript
// middleware/performance.ts
export function performanceMiddleware(req: NextRequest) {
  const start = Date.now();

  return new Response(JSON.stringify(data), {
    headers: {
      "X-Response-Time": `${Date.now() - start}ms`,
      "Content-Type": "application/json",
    },
  });
}
```

---

## 🚀 Quick Start Checklist

1. **Environment Setup**
   - [ ] Copy `.env.template` to `.env.development.local`
   - [ ] Fill in Supabase credentials
   - [ ] Install dependencies: `npm install`

2. **Database Setup**
   - [ ] Start Supabase: `npm run supabase:start`
   - [ ] Reset database: `npm run full-reset`
   - [ ] Verify seed data: Open Supabase Studio

3. **Development**
   - [ ] Start dev server: `npm run dev`
   - [ ] Run tests: `npx playwright test`
   - [ ] Make API changes following schema-driven workflow

4. **Frontend Integration**
   - [ ] Generate types: `npm run generate:api-types`
   - [ ] Configure openapi-fetch client
   - [ ] Implement type-safe API calls

The mock API server provides a complete, production-ready foundation for frontend development with full type safety, comprehensive testing, and realistic data scenarios.
