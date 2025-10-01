# BetaNXT Issuer Portal - Architecture Overview

This document visualizes the current architecture of the BetaNXT Issuer Portal application.

## Architecture Diagram

```mermaid
graph TB
    subgraph "User Browser"
        Browser[Browser]
    end

    subgraph "Next.js App :3000 - issuer-portal/"
        subgraph "Client Components ('use client')"
            Pages[Pages<br/>app/[clientTicker]/meeting/...]

            subgraph "State Management"
                ClientCtx[ClientContext<br/>- currentClient<br/>- availableClients]
                MeetingCtx[MeetingContext<br/>- currentMeeting<br/>- tasks<br/>- positions]
            end

            subgraph "Custom Hooks"
                useClients[useClients<br/>5sec cache]
                useTasks[useTasks]
                useDocuments[useDocuments]
                useMeetings[useMeetings<br/>5sec cache]
            end

            subgraph "UI Components"
                TaskDrawer[TaskDrawer]
                PhaseDrawer[PhaseDrawer]
                MeetingDocs[MeetingDocuments]
                Calendar[CalendarView]
            end
        end

        Auth[NextAuth v5<br/>JWT Strategy]
    end

    subgraph "Next.js API Server :3001 - mock-api-server/"
        APIRoutes[API Routes<br/>/api/clients<br/>/api/meetings<br/>/api/tasks<br/>/api/positions<br/>/api/documents]

        DomainModels[Domain Models<br/>Snake_case → camelCase]
    end

    subgraph "Supabase Local"
        PostgreSQL[(PostgreSQL<br/>Database)]
        Storage[Storage Bucket<br/>documents/]
        SupabaseAPI[Supabase REST API<br/>Auto-generated]
    end

    subgraph "Development Tools"
        OpenAPI[OpenAPI Spec<br/>openapi.yaml]
    end

    Browser -->|HTTP Requests| Pages
    Pages --> ClientCtx
    Pages --> MeetingCtx
    Pages --> UI Components

    ClientCtx --> useClients
    MeetingCtx --> useTasks
    MeetingCtx --> useMeetings
    UI Components --> useDocuments
    UI Components --> useTasks

    useClients -->|openapi-fetch| APIRoutes
    useTasks -->|openapi-fetch| APIRoutes
    useDocuments -->|openapi-fetch| APIRoutes
    useMeetings -->|openapi-fetch| APIRoutes

    Auth -->|Session Management| APIRoutes

    APIRoutes --> DomainModels
    DomainModels --> SupabaseAPI
    DomainModels --> Storage

    SupabaseAPI --> PostgreSQL

    OpenAPI -->|Generates| APIRoutes
    OpenAPI -->|Generates| PostgreSQL
    OpenAPI -->|Generates| DomainModels

    style Pages fill:#e1f5ff
    style ClientCtx fill:#fff4e1
    style MeetingCtx fill:#fff4e1
    style APIRoutes fill:#e8f5e9
    style PostgreSQL fill:#f3e5f5
    style OpenAPI fill:#fce4ec

    classDef clientSide fill:#e1f5ff
    classDef serverSide fill:#e8f5e9
    classDef database fill:#f3e5f5
```

## Architecture Overview

### Current Approach: Client-Side Single Page Application (SPA)

The application is built as a **client-side rendered SPA** using Next.js primarily as a React framework, not leveraging server-side rendering or incremental static regeneration.

### Key Characteristics

1. **100% Client-Side Rendered**
   - All pages use `'use client'` directive
   - Data fetched via `useEffect` hooks
   - No Server Components or server-side rendering

2. **OpenAPI-Driven Development**
   - Single source of truth: `openapi.yaml`
   - Generates TypeScript types
   - Generates database migrations
   - Generates API route structure

3. **State Management**
   - **ClientContext**: Manages current client selection and available clients
   - **MeetingContext**: Manages current meeting, tasks, positions, and key dates
   - Custom hooks for data fetching with lightweight in-memory caching (5 seconds)

4. **Data Flow**

   ```
   User Action → Component → Hook → openapi-fetch → API Route → Domain Model → Supabase → PostgreSQL
                                                                                → Storage
   ```

5. **Caching Strategy**
   - **5-second in-memory cache**: Prevents duplicate requests within same render cycle
   - **No persistent caching**: Each page load fetches fresh data
   - **No Next.js Data Cache**: Not using native `fetch()` with revalidation

### Technology Stack

#### Frontend (issuer-portal/)

- **Framework**: Next.js 15.5+ (App Router, client-side only)
- **UI Library**: MUI 7.3+ with BetaNXT Design System
- **Authentication**: NextAuth.js v5 (JWT strategy)
- **API Client**: openapi-fetch (type-safe, generated from OpenAPI spec)
- **State**: React Context + custom hooks
- **Forms**: React Hook Form + Zod validation

#### Backend (mock-api-server/)

- **Framework**: Next.js 15 API Routes
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **Schema**: OpenAPI 3.0 specification
- **Type Generation**: openapi-typescript

#### Database (Supabase)

- **PostgreSQL**: Relational database
- **Storage**: Object storage for documents
- **REST API**: Auto-generated from schema

### Data Architecture

#### Core Entities

- **Client**: Public companies (ELVN, PAYC, WWD, WEN)
- **Meeting**: Shareholder meetings with 8 phases
- **Task**: Phase-based tasks with owners (Issuer, BetaNXT, DFIN)
- **Proposal**: Voting items for meetings
- **Position**: Shareholdings with voting status
- **Document**: Files with versioning and approval workflow
- **User**: Authenticated users with role-based permissions

#### Key Relationships

```
Client 1:N Meeting
Meeting 1:N Task
Meeting 1:N Proposal
Meeting 1:N Position
Meeting 1:N Document
Task 1:1 Document (optional)
User N:M Client (via accounts)
```

### Deployment Architecture

**Development**:

- Frontend: `http://localhost:3000`
- API Server: `http://localhost:3001`
- Database: `postgresql://localhost:54322`
- Supabase Studio: `http://localhost:54323`

**Production** (assumed):

- Deployed to Vercel or similar platform
- API routes serverless functions
- Remote Supabase instance

### Known Limitations

1. **No SSR/SSG**: Not leveraging Next.js server-side rendering capabilities
2. **Client-Side Data Fetching**: All data fetched after page load (slower initial render)
3. **No Route Caching**: Dynamic routes not cached at build time
4. **Minimal Request Deduplication**: Only 5-second cache window
5. **No Optimistic Updates**: UI waits for server confirmation

### Potential Improvements

To align with Next.js best practices, consider:

1. **Server Components**: Move data fetching to server for faster initial loads
2. **Native Fetch with Revalidation**: Use `fetch()` with `{ next: { revalidate: 60 } }`
3. **Server Actions**: Replace client-side mutations with server actions
4. **Partial Prerendering**: Use static shells with dynamic content
5. **Route Segment Config**: Add `export const dynamic = 'force-static'` where possible

**Note**: These improvements would require significant architectural changes and should be evaluated against project priorities and timelines.

---

**Last Updated**: January 2025
