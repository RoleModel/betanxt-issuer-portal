# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project**: BetaNXT Issuer Portal - Proxy Voting & Shareholder Meeting Management System
**Architecture**: Turborepo monorepo with Next.js 15+ applications
**Language**: TypeScript 5.x with React 18+
**Database**: PostgreSQL with Supabase (local development)
**Authentication**: NextAuth.js v4 with role-based access control
**UI Framework**: MUI 7.3+ with @rolemodel/betanxt-design-system
**Testing**: Playwright for E2E testing

## Monorepo Structure

This is a Turborepo workspace with two main applications:

- **issuer-portal/**: Next.js 15 frontend application (port 3000)
- **mock-api-server/**: Next.js 15 backend API server (port 3001)
- **supabase/**: Database schema, migrations, and seed data

## Common Commands

### Development

- `npm run dev` - Start both applications in development mode
- `npm run build` - Build both applications
- `npm run lint` - Lint all workspaces
- `npm run type-check` - Type check all workspaces
- `npm run test` - Run Playwright tests across workspaces
- `npm run format` - Format code with Prettier

### Database Operations (from mock-api-server/)

- `npm run supabase:start` - Start local Supabase instance
- `npm run supabase:stop` - Stop local Supabase instance
- `npm run supabase:reset` - Reset database with fresh schema and seed data
- `npm run generate:seeds` - Generate fresh seed data from TypeScript
- `npm run generate:db-types` - Generate TypeScript types from database schema
- `npm run full-reset` - Complete reset: schema → seeds → database → types

### Schema-Driven Development Workflow

**CRITICAL**: Always follow this exact flow when making API/data changes:

1. **Update OpenAPI spec**: Edit `mock-api-server/openapi-schema/openapi.yaml`
2. **Generate database schema**: `npm run generate:postgres-schema` (creates SQL migrations)
3. **Generate seed data** (optional): `npm run generate:seeds` (creates seed.sql)
4. **Reset database**: `supabase db reset` (applies migrations and seeds)
5. **Generate types**: `npm run generate:db-types` && `npm run generate:api-types`
6. **MANUALLY update domain transforms**: Update `mock-api-server/domain-models/api/*.ts` to handle snake_case→camelCase conversions for new fields

**Common Pitfall**: Missing step 6 causes silent data loss. Every new OpenAPI field must appear in:

- DB migration (auto-generated)
- Generated types (auto-generated)
- Domain model transforms (MANUAL)
- Any create/update functions (MANUAL)

### Testing

- `npm run test` - Run all Playwright tests
- `npm run test:ui` - Run tests with Playwright UI
- `npm run test:unit` - Unit tests only
- `npm run test:integration` - Integration tests only
- `npm run test:e2e` - End-to-end tests only

## Architecture

### Frontend (issuer-portal/)

- **Framework**: Next.js 15 with app directory structure (client-side rendered)
- **State Management**: React Context + custom hooks with lightweight in-memory caching
- **Authentication**: NextAuth.js v5 with role-based access control
- **UI Components**: MUI 7.3+ with BetaNXT design system
- **Forms**: React Hook Form with Zod validation
- **PDF Handling**: react-pdf for document viewing
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
"@/utils/*": ["./utils/*"]
"@/types/*": ["./types/*"]
"@rolemodel/*": ["./node_modules/@rolemodel/betanxt-design-system/*"]
"@/theme/*": ["./components/mui-styling/theme/*"]
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
import { Component } from '@rolemodel/betanxt-design-system'
import React from 'react'

// MUI imports
import { Button } from '@mui/material'

// Local component imports
import { Header } from '@/components/Header'

// Domain model imports
import { User } from '@/domain-models/User'

// Relative imports
import './styles.css'
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

1. **Install dependencies**: `npm install` (from root)
2. **Start Supabase**: `cd mock-api-server && npm run supabase:start`
3. **Set up database**: `npm run full-reset` (from mock-api-server/)
4. **Start applications**: `npm run dev` (from root)

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

---

**Node Version**: 22.15.x (enforced via engines)
**Package Manager**: npm 10.9.3
**Last Updated**: September 26, 2025

- Do not use 'any' type assetions. This can cause unintended bugs within our system because any could be anything, the Typescript type checker won’t type check the code when any is involved. You could end up in a situation where you expected a number for customer balance calculation, and instead got something completely different, at the very least providing an unreliable experience to users of the system or could be worse.
- **CRITICAL** Do not use ANY type inferences.
