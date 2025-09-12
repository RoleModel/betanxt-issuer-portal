# Claude Context: Issuer Portal

**Project**: BetaNXT Issuer Portal - Corporate Shareholder Meeting Management  
**Architecture**: Contract-First Design with mock-api-server + issuer-portal  
**Generated**: 2025-09-12  
**Version**: 0.1.0

## Technology Stack

**Core Technologies**:
- TypeScript 5.8.2 (strict mode)
- React 19.0.0 with Next.js 15.4.5
- Material UI 7.3.2 + MUI X Pro components
- Node.js 22.15.x runtime

**Database & APIs**:
- Supabase (PostgreSQL) for mock data layer
- OpenAPI 3.0 contracts defining all API interfaces
- OpenAPI-fetch for type-safe API clients
- Contract-first design for future backend compatibility

**Testing & Quality**:
- Cypress 14.2.0 for component testing
- Playwright for end-to-end testing
- Jest for contract testing
- ESLint 9.32.0 + Prettier 3.6.2

## Project Structure

```
issuer-portal/
├── apps/
│   ├── mock-api-server/          # Backend API with Supabase
│   │   ├── domain-models/        # Shared data models
│   │   ├── schemas/              # Database schemas
│   │   └── supabase/            # Supabase configuration
│   └── issuer-portal/           # Frontend React app
│       ├── components/          # UI components
│       ├── domain-models/       # Shared data models
│       ├── hooks/              # React hooks
│       └── utils/              # Utility functions
└── specs/001-develop-the-issuer/ # Feature specification
    ├── contracts/openapi.yaml  # API contracts
    ├── data-model.md           # Domain entities
    └── quickstart.md          # E2E validation
```

## Core Domain Entities

**Meeting Event**: Corporate shareholder meeting with 8-phase workflow
**Meeting Phase**: Sequential stages (Project Launch → Registered Vote Report)  
**Task**: Action items within each phase requiring completion
**Document**: Uploaded files (proxy statements, voting materials, reports)
**User Profile**: Role-based access (issuer, RM, admin, producer)
**Approval Workflow**: Document and phase approval processes
**Voting Record**: Real-time and final voting tabulation data

## Key Features

**8-Phase Meeting Process**:
1. Project Launch & Data Check
2. Broker Search, Authorizations, and Proxy Card Notice  
3. Approaching Record Date, Proxy Card Readiness
4. Shareholder Record File delivery expectations
5. Pre-Mail Date
6. Post Mail Date – Pre-Vote & Tabulation Reporting
7. Tabulation Report & Meeting Details
8. Registered Vote Report

**Core Functionality**:
- Document upload with drag-and-drop and agenda extraction
- Real-time voting tabulation (<500ms updates)
- Role-based dashboards and task management
- Approval workflows with version control
- Compliance audit trails and reporting

## API Architecture

**Contract-First Design**:
- OpenAPI 3.0 specifications define all endpoints
- mock-api-server provides temporary implementation
- OpenAPI-fetch generates type-safe frontend clients
- Future backends only need OpenAPI compliance

**Key Endpoints**:
- `/meetings` - Meeting CRUD operations
- `/meetings/{id}/phases` - Phase management
- `/meetings/{id}/documents` - Document handling
- `/approvals` - Approval workflow management
- `/meetings/{id}/votes` - Voting and tabulation

## Authentication & Authorization

**Auth0 Integration**:
- JWT bearer token authentication
- Role-based access control (4 user types)
- Session management via @auth0/nextjs-auth0

**User Roles**:
- **Corporate Issuer**: Manages company meeting tasks
- **Relationship Manager**: Creates events, provides support
- **Administrator**: System oversight and operations
- **Meeting Producer**: Virtual meeting execution

## Performance Requirements

**Response Times**:
- Vote submission: <200ms
- Dashboard updates: <500ms  
- Document uploads: Progress indication
- Real-time voting: <1 second latency

**Scale Targets**:
- 500-1,000 concurrent issuers
- 100-500 active meetings
- 10,000 concurrent users during peak
- 50GB-5TB storage growth projection

## Constitutional Compliance

**Simplicity**: 2 projects (frontend + backend), direct framework usage
**Architecture**: Feature libraries, shared domain models, contract-driven
**Testing**: RED-GREEN-Refactor cycle, contract tests before implementation
**Observability**: Structured logging, unified error reporting
**Versioning**: Semantic versioning with build increments

## Development Workflow

**Contract-First Flow**:
1. Define OpenAPI specifications for new endpoints
2. Generate TypeScript types from OpenAPI specs
3. Generate API clients using OpenAPI-fetch
4. Write failing contract tests
5. Implement mock-api-server endpoints
6. Build frontend components with type-safe clients
7. Validate with quickstart scenarios

**Component Development**:
- Use Material UI 7.x components as foundation
- Follow BetaNXT design system patterns
- Implement responsive design (desktop/tablet)
- Include accessibility (aria-* attributes)
- Use theme.vars.palette.primary.main for colors

## Recent Changes

**2025-09-12**: Initial project setup and Phase 1 design completion
- Generated OpenAPI contracts for all core functionality
- Created comprehensive data model with 8 entities
- Established contract-first development workflow
- Set up type-safe API client generation with OpenAPI-fetch

## Common Patterns

**API Client Usage**:
```typescript
import { createClient } from 'openapi-fetch'
import type { paths } from './generated/api-types'

const client = createClient<paths>({ baseUrl: 'http://localhost:3001' })
const { data, error } = await client.GET('/meetings')
```

**Component Structure**:
```typescript
import { Grid, Typography, Card } from '@mui/material'
import { useTheme } from '@mui/material/styles'

export function MeetingCard({ meeting }: { meeting: MeetingEvent }) {
  const theme = useTheme()
  return (
    <Card sx={{ p: theme.spacing(2) }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Typography variant="h6">{meeting.companyName}</Typography>
        </Grid>
      </Grid>
    </Card>
  )
}
```

**Error Handling**:
```typescript
try {
  const { data, error } = await client.POST('/meetings', { body: meetingData })
  if (error) {
    // Handle API error response matching OpenAPI schema
    console.error(error.message)
  }
} catch (e) {
  // Handle network/client errors
}
```

---

*Context updated automatically - preserve manual additions between markers*