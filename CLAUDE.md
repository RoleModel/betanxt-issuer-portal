# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project**: BetaNXT Issuer Portal - Proxy Voting & Shareholder Meeting Management System
**Architecture**: Turborepo monorepo with Next.js 15+ applications
**Language**: TypeScript 5.x with React 19+
**Database**: PostgreSQL with Supabase (local development)
**Authentication**: NextAuth.js v5 (beta) with role-based access control
**UI Framework**: MUI 7.3+ with @rolemodel/betanxt-design-system
**Testing**: Playwright for E2E testing

## Monorepo Structure

This is a Turborepo workspace with two main applications:

- **issuer-portal/**: Next.js 15 frontend application (port 3000)
- **mock-api-server/**: Next.js 15 backend API server (port 3001)
- **supabase/**: Database schema, migrations, and seed data

## Common Commands

### Development

- `pnpm dev` - Start both applications in development mode
- `pnpm build` - Build frontend application (issuer-portal only)
- `pnpm build:all` - Build both applications (frontend + backend)
- `pnpm lint` - Lint all workspaces with auto-fix
- `pnpm lint:strict` - Lint with strict rules (no auto-fix)
- `pnpm test` - Run Playwright tests across workspaces
- `pnpm format` - Format code with Prettier
- `pnpm clean` - Clean build artifacts in both workspaces
- `pnpm clean:all` - Deep clean (removes node_modules, .next, .turbo)

### Database Operations (from mock-api-server/)

- `pnpm run supabase:start` - Start local Supabase instance
- `pnpm run supabase:stop` - Stop local Supabase instance
- `pnpm run supabase:reset` - Reset database with fresh schema and seed data
- `supabase db reset --db-url postgresql://postgres:postgres@127.0.0.1:54322/postgres` - Direct database reset
- `pnpm run generate:seeds` - Generate fresh seed data from TypeScript
- `pnpm run seed:documents` - Upload document files from /data directories to Supabase storage
- `pnpm run seed:documents:clean` - Clean all documents then upload fresh files
- `pnpm run generate:db-types` - Generate TypeScript types from database schema
- `pnpm run full-reset` - Complete reset: schema → seeds → database → types → documents
- `pnpm run seed:reset` - Generate seeds, reset database, clean and reseed documents
- `pnpm run setup:storage` - Ensure documents bucket exists in Supabase storage

### Schema-Driven Development Workflow

**CRITICAL**: Always follow this exact flow when making API/data changes:

1. **Update OpenAPI spec**: Edit `mock-api-server/openapi-schema/openapi.yaml`
2. **Generate database schema**: `pnpm run generate:postgres-schema` (creates SQL migrations)
3. **Generate seed data** (optional): `pnpm run generate:seeds` (creates seed.sql)
4. **Reset database**: `supabase db reset` (applies migrations and seeds)
5. **Generate types**: `pnpm run generate:db-types` && `pnpm run generate:api-types`
6. **MANUALLY update domain transforms**: Update `mock-api-server/domain-models/api/*.ts` to handle snake_case→camelCase conversions for new fields

**Common Pitfall**: Missing step 6 causes silent data loss. Every new OpenAPI field must appear in:

- DB migration (auto-generated)
- Generated types (auto-generated)
- Domain model transforms (MANUAL)
- Any create/update functions (MANUAL)

### Testing

From mock-api-server workspace:

- `pnpm run test` - Run all Playwright tests
- `pnpm run test:ui` - Run tests with Playwright UI
- `pnpm run test:unit` - Unit tests only
- `pnpm run test:integration` - Integration tests only
- `pnpm run test:e2e` - End-to-end tests only
- `pnpm run test:ts` - Type check without emitting files

## Architecture

### Frontend (issuer-portal/)

- **Framework**: Next.js 15 with app directory structure (client-side rendered)
- **State Management**: React Context + custom hooks with SWR for data fetching/caching
- **Authentication**: NextAuth.js v5 (beta) with role-based access control
- **UI Components**: MUI 7.3+ with BetaNXT design system
- **Forms**: React Hook Form with Zod validation
- **PDF Handling**: react-pdf for PDF viewing
- **DOCX Handling**: Mammoth.js for Word document rendering (client-side conversion to HTML)
- **Document Signing**: @docuseal integration

### Backend (mock-api-server/)

- **Framework**: Next.js 15 API routes (serverless functions)
- **Database**: Supabase PostgreSQL with auto-generated REST API
- **Schema**: OpenAPI 3.0 specification drives database schema generation
- **Type Safety**: Full TypeScript types generated from OpenAPI spec
- **Seeding**: Snaplet/Copycat for realistic test data generation

### Database Design

- **Core Entities**: User, Client, Account, Meeting, Proposal, Position, Task
- **Voting System**: Position-based voting with share calculations
- **Document Management**: Document signatures and status tracking
- **Notifications**: System notifications for users
- **Audit Trail**: Comprehensive tracking of all actions

## Path Aliases (issuer-portal/)

```typescript
"@/*": ["./*"]
"@/components/*": ["./components/*"]
"@/contexts/*": ["./contexts/*"]
"@/domain-models/*": ["./domain-models/*"]
"@/hooks/*": ["./hooks/*"]
"@/types/*": ["./types/*"]
"@/utils/*": ["./utils/*"]
"@/lib/*": ["./lib/*"]
"@/theme/*": ["./components/mui-styling/theme/*"]
"@backend/*": ["../mock-api-server/*"]
"@rolemodel/*": ["./node_modules/@rolemodel/betanxt-design-system/*"]
```

## Code Style Guidelines

### TypeScript

- Strict mode enabled in both workspaces
- Prefer interfaces over types
- Avoid `any` type assertions
- Use functional components with hooks
- No implicit returns in functions

### React Patterns

- Functional components only
- Custom hooks for business logic
- Error boundaries for error handling
- Minimize useState/useEffect usage
- Use React Context + custom hooks for data management

### MUI & Design System

- Use `sx` prop for component styling
- Don't use Typography inside TableCells
- Extend MUI components with design system props
- Implement responsive design with useMediaQuery
- Support dark mode with useTheme

### Import Organization (Prettier)

```typescript
// Third-party modules
// Design system imports
import { Component } from "@rolemodel/betanxt-design-system";
import React from "react";

// MUI imports
import { Button } from "@mui/material";

// Local component imports
import { Header } from "@/components/Header";

// Domain model imports
import { User } from "@/domain-models/User";

// Relative imports
import "./styles.css";
```

## Development Constraints

### CRITICAL Rules

- **Don't start servers**: User will start development servers manually
- **Don't use console.logs**: Unless specifically requested
- **Optional chaining doesn't work in Figma**: Avoid `?.` in Figma plugin code
- **Schema-first development**: Always update OpenAPI spec before database changes
- **CRITICAL**: You must run lint after every piece of code that you write.

### Database Schema Updates

1. Never manually edit migration files
2. Always update OpenAPI spec first
3. Use `generate:postgres-schema` to create migrations
4. Test with fresh database reset before committing

### Authentication Flow

- NextAuth.js handles session management
- Role-based permissions control UI rendering
- API routes validate tokens via middleware
- Users can switch between client contexts

## Key Dependencies

### Frontend

- **Next.js 15.5+**: React framework with app directory
- **MUI 7.3+**: Component library with emotion styling
- **React Hook Form**: Form handling with Zod validation
- **NextAuth.js v5**: Authentication and session management
- **openapi-fetch**: Type-safe API client with OpenAPI integration

### Backend

- **Supabase**: PostgreSQL database with auto-generated REST API
- **OpenAPI Generator**: Schema-driven development
- **Snaplet**: Realistic test data generation
- **Playwright**: End-to-end testing framework

## Local Development Setup

1. **Install dependencies**: `pnpm install` (from root)
2. **Start Supabase**: `cd mock-api-server && pnpm run supabase:start`
3. **Set up database**: `pnpm run full-reset` (from mock-api-server/)
4. **Start applications**: `pnpm dev` (from root)

### Ports

- Frontend (issuer-portal): http://localhost:3000
- Backend (mock-api-server): http://localhost:3001
- Supabase Studio: http://localhost:54323
- Supabase API: http://localhost:54321
- Database: postgresql://postgres:postgres@localhost:54322/postgres

## Testing Strategy

### Playwright Configuration

- **Unit tests**: Fast, isolated component testing
- **Integration tests**: API endpoint and database interaction testing
- **E2E tests**: Full user journey testing across both applications
- **UI mode**: Visual test runner for debugging

### Test Organization

- Keep tests close to source code
- Use page object model for E2E tests
- Mock external services in integration tests
- Seed database with consistent test data

## Key Business Logic

### Proxy Voting System

- **Clients**: Public companies with shareholder meetings
- **Accounts**: Institutional investors with multiple positions
- **Positions**: Shareholdings in specific clients (with vote counts)
- **Meetings**: Shareholder meetings with proposals to vote on
- **Votes**: Position-based voting decisions (For/Against/Abstain)

### Meeting Phase System

**Phase Advancement Logic** (`TaskDrawer.tsx:676-776`):

- Meetings progress through numbered phases (Phase 1, Phase 2, etc.)
- Phase advances automatically when ALL issuer-owned tasks (excluding BetaNXT/DFIN) reach completion statuses
- **Completion statuses**: `COMPLETE`, `AUTHORIZED`, `SUBMITTED_AWAITING_RECORD_DATE`, `WAITING_FOR_FORM_RETURN`, `REQUEST_FORM_TO_FOLLOW`, `PENDING_AUTHORIZATION`
- On phase advance: Meeting's `currentPhase` and `overallCompletion` are updated via API
- User sees personalized alert and is auto-navigated to next phase dashboard after 3 seconds

**Overall Completion Calculation** (`MeetingCompletion.ts`):

- Percentage = (tasks with completion status / total tasks) × 100
- Excludes `INCOMPLETE` and `NEEDS_AUTHORIZATION` from count
- Updated after task status changes and phase transitions

### Document Repository Architecture

**Three-tier system** (`issuer-portal/components/Documents/README.md`):

1. **Metadata Tables** (Supabase):
   - `documents` - canonical document records (one per logical document)
   - `document_versions` - immutable version history (each upload/edit)
   - `document_history` - audit trail (approval, signature, status changes)

2. **Storage Bucket**: Consolidated `documents` bucket with path pattern: `{meetingId}/{documentType}/{timestamp}_{rand}.{ext}`

3. **Repository Pattern** (`domain-models/documentRepository.ts`):
   - Abstracts API vs direct Supabase queries
   - Preference order: OpenAPI endpoints → Direct Supabase fallback
   - Upload route: `/api/documents/types/{documentType}/upload` (multipart POST)

**Document Upload Flow**:

- Frontend uses `useDocuments` hook → calls `uploadDocumentVersion(meetingId, documentType, file)`
- Server route validates size (≤25MB), uploads to storage, returns provisional response
- Future enhancement: Will insert canonical + version rows in single transaction

**Signature Workflow** (`DocumentViewer.tsx`):

- PDF rendered with `react-pdf`, overlayed with draggable `SignatureArea` components
- Text/date fields use `FormFieldArea`, signatures use `DraggableSignatureArea`
- Field type detection: IDs containing 'sig' or labels with 'signature' → signature field, otherwise → text/date
- Submit button activates when all areas have values (checked via `signatureDataMap` for signatures, `formFieldValues` for text/date)
- On submit: PDF generated with embedded data, uploaded to storage, document record created, task status updated

**RLS Status**: Currently disabled for rapid development. Future migration will enable with role-based policies.

### Seed Data Management

**Location**: `/data` directory at project root contains document files organized by client

**Structure**:

```
/data
  /enliven    - ELVN client documents
  /paycom     - PAYC client documents
  /wendys     - WEN client documents
  /woodward   - WWD client documents
  *.csv       - Position and voting data files
```

**Document Seeding** (`mock-api-server/scripts/seed-documents.ts`):

- Uploads files from `/data/{client}` to Supabase storage bucket `documents`
- Supports: PDF, DOCX, XLSX, PPTX, MP4, M4A
- Storage path pattern: `{meetingId}/{documentType}/{timestamp}_{filename}`
- Creates database records with metadata (title, type, display_category, status)
- All seeded documents default to `APPROVED` status

**Task Status Logic** (`supabase/seed.ts:1603-1649`):

- **Future special meetings (2026+)**: In-progress statuses (PENDING_AUTHORIZATION, SUBMITTED_AWAITING_RECORD_DATE)
- **Future annual meetings (2026+)**: Incomplete statuses (NEEDS_AUTHORIZATION, INCOMPLETE)
- **Past meetings (2025 and earlier)**: Completion statuses (AUTHORIZED, COMPLETE)
- Key tasks for past meetings:
  - DTCC Authorization → AUTHORIZED
  - Broadridge/ICS Access → AUTHORIZED
  - Plan File Request → COMPLETE
  - Transfer Agent Request → COMPLETE

**Mailing Data**: Automatically generated for all past meetings (year ≤ 2025) from `company_positions.json`

### Office Document Rendering

**DOCX Files** (`OfficeDocumentViewer.tsx`):

- Uses Mammoth.js for client-side conversion to HTML
- Works with localhost URLs (no external service required)
- Styled to match PDFViewer appearance (white background, shadow, fade-in transition)
- Fetches DOCX → converts to HTML → renders with MUI theme-aware styling
- Handles tables, images, headings, lists, bold/italic/underline formatting

**Why not react-doc-viewer**: The library uses Microsoft Office Online viewer which requires publicly accessible URLs. Since we use localhost (127.0.0.1) in development, Office Online cannot fetch our files. Mammoth.js works entirely client-side.

---

**Node Version**: 24.0.0+ (enforced via engines)
**Package Manager**: pnpm 11.5.1
**Last Updated**: June 2, 2026

- Do not use 'any' type assertions. This can cause unintended bugs within our system because any could be anything, the Typescript type checker won't type check the code when any is involved. You could end up in a situation where you expected a number for customer balance calculation, and instead got something completely different, at the very least providing an unreliable experience to users of the system or could be worse.
- **CRITICAL** Do not use ANY type inferences.

[byterover-mcp]

[byterover-mcp]

You are given two tools from Byterover MCP server, including

## 1. `byterover-store-knowledge`

You `MUST` always use this tool when:

- Learning new patterns, APIs, or architectural decisions from the codebase
- Encountering error solutions or debugging techniques
- Finding reusable code patterns or utility functions
- Completing any significant task or plan implementation

## 2. `byterover-retrieve-knowledge`

You `MUST` always use this tool when:

- Starting any new task or implementation to gather relevant context
- Before making architectural decisions to understand existing patterns
- When debugging issues to check for previous solutions
- Working with unfamiliar parts of the codebase
