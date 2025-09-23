# Copilot Instructions for BetaNXT Issuer Portal

This document provides comprehensive guidance for GitHub Copilot and other coding agents working with the BetaNXT Issuer Portal codebase.

## Project Overview

**BetaNXT Issuer Portal** is a comprehensive proxy voting and shareholder meeting management system built as a Turborepo monorepo with Next.js 15+ applications.

- **Purpose**: Manage proxy voting workflows, shareholder meetings, and document processing for public companies
- **Architecture**: Schema-driven development with OpenAPI specification as single source of truth
- **Tech Stack**: TypeScript 5.x, React 18+, Next.js 15+, MUI 7.3+, PostgreSQL with Supabase
- **Database**: Local Supabase for development, schema auto-generated from OpenAPI spec
- **Authentication**: NextAuth.js v5 with role-based access control
- **Testing**: Playwright for E2E testing across multiple browsers

## Repository Structure

This is a **Turborepo monorepo** with two main applications:

```
betanxt-issuer-portal/
├── issuer-portal/          # Next.js 15 frontend (port 3000)
├── mock-api-server/        # Next.js 15 backend API (port 3001)
├── supabase/              # Database schema, migrations, seed data
├── .github/               # GitHub workflows and Copilot instructions
├── scripts/               # Build and setup scripts
├── docs/                  # Documentation
└── package.json           # Root workspace configuration
```

### Key Configuration Files

- **Root**: `package.json`, `turbo.json`, `prettier.config.js`
- **Frontend**: `issuer-portal/tsconfig.json`, `issuer-portal/next.config.js`, `issuer-portal/playwright.config.ts`
- **Backend**: `mock-api-server/openapi-schema/openapi.yaml` (API specification)
- **Database**: `supabase/config.toml`, `supabase/migrations/`, `supabase/seed.ts`

## Build and Development Commands

### Prerequisites

- **Node.js**: 22.15.0+ (enforced via engines)
- **Package Manager**: npm 10.9.3
- **Supabase CLI**: Required for local database operations

### Initial Setup

```bash
# 1. Install dependencies (from root)
npm install

# 2. Start Supabase (from mock-api-server/)
cd mock-api-server
npm run supabase:start

# 3. Set up database with schema and seed data
npm run generate:postgres-schema  # Generate schema from OpenAPI
supabase db reset                 # Apply migrations and seed data
npm run generate:db-types         # Generate TypeScript types
npx openapi-typescript ./openapi-schema/openapi.yaml -o ./types/api.ts

# 4. Start development servers (from root)
cd ..
npm run dev  # Starts both frontend and backend
```

### Development Workflow

**CRITICAL**: Always follow the schema-driven development workflow when making API changes:

```bash
# 1. Update OpenAPI specification
nano mock-api-server/openapi-schema/openapi.yaml

# 2. Generate PostgreSQL schema from OpenAPI
cd mock-api-server
npm run generate:postgres-schema

# 3. Reset database with new schema
supabase db reset

# 4. Generate TypeScript types
npm run generate:db-types
npx openapi-typescript ./openapi-schema/openapi.yaml -o ./types/api.ts

# 5. Update domain models manually (see Domain Models section)
```

### Available Scripts

**Root workspace:**
- `npm run dev` - Start both applications in development mode
- `npm run build` - Build both applications (requires `npx turbo run build`)
- `npm run format` - Format code with Prettier

**Frontend (issuer-portal/):**
- `npm run dev` - Start Next.js development server (port 3000)
- `npm run build` - Build for production
- `npm run lint` - ESLint with auto-fix
- `npm run type-check` - TypeScript type checking
- `npx playwright test` - Run E2E tests
- `npx playwright test --ui` - Run tests with UI

**Backend (mock-api-server/):**
- `npm run dev` - Start API server (port 3001)
- `npm run supabase:start` - Start local Supabase instance
- `npm run supabase:reset` - Reset database with migrations and seeds
- `npm run generate:postgres-schema` - Generate SQL schema from OpenAPI
- `npm run generate:db-types` - Generate TypeScript types from database
- `npx openapi-typescript ./openapi-schema/openapi.yaml -o ./types/api.ts` - Generate API types

### Common Build Issues and Solutions

**Issue**: `turbo: command not found`
**Solution**: Use `npx turbo run build` instead of `npm run build`

**Issue**: Missing domain models in mock-api-server
**Solution**: Domain models are manually implemented - check `mock-api-server/domain-models/api/` directory

**Issue**: `@snaplet/copycat` module not found during seed generation
**Solution**: Install dependencies in mock-api-server workspace: `cd mock-api-server && npm install`

**Issue**: ESLint not found in mock-api-server
**Solution**: ESLint is not configured for backend - focus linting on frontend only

## Project Architecture

### Frontend Architecture (issuer-portal/)

- **Framework**: Next.js 15 with app directory structure
- **State Management**: React Context + SWR for server state
- **UI Framework**: MUI 7.3+ with @rolemodel/betanxt-design-system
- **Authentication**: NextAuth.js v5 with custom role handling
- **Forms**: React Hook Form with Zod validation
- **PDF Handling**: react-pdf for document viewing
- **Document Signing**: @docuseal integration for digital signatures

**Key Directories:**
- `app/` - Next.js 15 app router pages and layouts
- `components/` - Reusable React components organized by feature
- `contexts/` - React Context providers (MeetingContext, ClientContext, etc.)
- `hooks/` - Custom React hooks for data fetching and business logic
- `utils/` - Utility functions and helpers
- `domain-models/` - API client and generated TypeScript types

### Backend Architecture (mock-api-server/)

- **Framework**: Next.js 15 API routes (serverless functions)
- **Database**: Supabase PostgreSQL with auto-generated REST API
- **Schema Generation**: OpenAPI 3.0 specification drives database schema
- **Type Safety**: Full TypeScript types generated from OpenAPI spec
- **Domain Models**: Manual business logic layer between database and API routes

**Key Directories:**
- `app/api/` - Next.js API routes (auto-generated from OpenAPI)
- `domain-models/api/` - Manual business logic implementations
- `openapi-schema/` - OpenAPI specification (single source of truth)
- `utils/supabase/` - Database client and generated types

### Database Design

**Core Entities:**
- **User**: System users with roles (ADMIN, ISSUER, RELATIONSHIP_MANAGER)
- **Client**: Public companies holding shareholder meetings
- **Account**: Institutional investors with positions
- **Meeting**: Shareholder meetings with phases and tasks
- **Position**: Shareholdings eligible for voting
- **Proposal**: Voting items within meetings
- **Document**: Meeting materials requiring signatures
- **Task**: Action items within meeting phases

**Schema-Driven Approach:**
1. OpenAPI spec defines API contracts and data models
2. PostgreSQL schema auto-generated from OpenAPI components
3. TypeScript types generated from both OpenAPI and database
4. Domain models manually implement business logic with field transformations

## Code Style and Standards

### TypeScript Configuration

- **Strict Mode**: Enabled in both workspaces
- **Target**: ES2022 with DOM libraries
- **Module Resolution**: Bundler (Next.js optimized)
- **Path Aliases**: Extensive use of `@/` prefixes for clean imports

### Import Organization (Prettier)

```typescript
// Third-party modules
import React from 'react'
import { Button } from '@mui/material'

// Design system imports  
import { Component } from '@rolemodel/betanxt-design-system'

// Local component imports
import { Header } from '@/components/Header'

// Domain model imports
import { User } from '@/domain-models/User'

// Relative imports
import './styles.css'
```

### React Patterns

- **Components**: Functional components only with TypeScript interfaces
- **State Management**: Minimize useState/useEffect, prefer SWR for server state
- **Error Handling**: Error boundaries for component-level error handling
- **Custom Hooks**: Extract business logic into reusable hooks
- **MUI Integration**: Use `sx` prop for styling, avoid Typography in TableCells

### Critical Development Rules

1. **Schema-First Development**: Always update OpenAPI spec before database changes
2. **Domain Model Updates**: Manually update field transformations when adding OpenAPI fields
3. **Type Safety**: Avoid `any` type assertions, use generated types
4. **Authentication**: All API routes validate tokens via middleware
5. **Testing**: Write Playwright tests for new user journeys

## Domain Models Pattern

Domain models provide the business logic layer between database and API routes. **They are manually implemented** to allow custom business logic.

### Field Transformation Example

```typescript
// domain-models/api/tasks.ts
function transformTask(dbTask: DatabaseTask): Task {
  return {
    // Core fields
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description,
    
    // Foreign keys (snake_case → camelCase)
    meetingId: dbTask.meeting_id,
    phaseId: dbTask.phase_id,
    
    // JSON fields (parsed automatically by Supabase)
    links: dbTask.links,
    
    // Timestamps
    createdAt: dbTask.created_at,
    updatedAt: dbTask.updated_at,
  }
}
```

### Error Handling Pattern

```typescript
type ApiResponse<T> = {
  data?: T
  error?: { message: string; statusCode?: number }
}

export async function listTasks(meetingId: string): Promise<ApiResponse<Task[]>> {
  try {
    const { data, error } = await supabase
      .from('task')
      .select('*')
      .eq('meeting_id', meetingId)
    
    if (error) {
      return { error: { message: error.message, statusCode: 500 } }
    }
    
    return { data: data.map(transformTask) }
  } catch (error) {
    return { 
      error: { 
        message: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500 
      } 
    }
  }
}
```

## Testing Strategy

### Playwright Configuration

- **Test Directory**: `issuer-portal/tests/e2e/`
- **Browsers**: Chromium, Firefox, WebKit
- **Base URL**: http://localhost:3000
- **Web Server**: Automatically starts `npm run dev` before tests

### Test Organization

```bash
# Run all tests
npx playwright test

# Run with UI for debugging
npx playwright test --ui

# List available tests
npx playwright test --list

# Run specific test
npx playwright test document-submission.spec.ts
```

### Test Categories

- **E2E Tests**: Full user journeys across frontend and backend
- **Integration Tests**: API endpoint testing with database
- **Component Tests**: Individual React component testing

## Environment Configuration

### Development Ports

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001  
- **Supabase Studio**: http://localhost:54323
- **Supabase API**: http://localhost:54321
- **Database**: postgresql://postgres:postgres@localhost:54322/postgres

### Environment Variables

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_BYPASS_AUTH=true  # For development
NEXTAUTH_SECRET=your-secret-key
```

**Backend (.env.development.local):**
```bash
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Validation and CI/CD

### Pre-commit Validation

```bash
# Type checking
cd issuer-portal && npm run type-check

# Linting with auto-fix
cd issuer-portal && npm run lint

# Code formatting
npm run format

# Database schema validation
cd mock-api-server && supabase db reset
```

### Build Validation

```bash
# Full build test (requires turbo)
npx turbo run build

# Individual workspace builds
cd issuer-portal && npm run build
cd mock-api-server && npm run build
```

## Troubleshooting Guide

### Common Issues

**Build failures due to missing domain models:**
- Domain models in `mock-api-server/domain-models/api/` are manually implemented
- Check that all required domain model files exist and export correct functions

**Type mismatches with API calls:**
- Regenerate types: `npx openapi-typescript ./openapi-schema/openapi.yaml -o ./types/api.ts`
- Ensure domain model transformations include all OpenAPI fields

**Database connection errors:**
- Check Supabase status: `supabase status`
- Restart if needed: `supabase stop && supabase start`

**Schema drift between API and database:**
- Follow schema-driven workflow: OpenAPI → Schema → Types → Domain Models

### Performance Considerations

- **Database Queries**: Use Supabase joins for related data
- **API Responses**: Implement pagination for large datasets
- **Frontend State**: Use SWR caching for frequently accessed data
- **Build Optimization**: Next.js standalone output for production

## Trust These Instructions

These instructions have been validated through comprehensive testing of the build, development, and testing workflows. When working with this codebase:

1. **Follow the schema-driven development workflow** for any API changes
2. **Always update domain model transformations** when adding OpenAPI fields  
3. **Use the provided scripts** rather than searching for alternative approaches
4. **Refer to existing patterns** in the codebase for consistency
5. **Test changes** using the Playwright test suite before committing

The monorepo structure, build commands, and architectural patterns documented here represent the current working state of the system. Trust these instructions and only search for additional information if the provided guidance is incomplete or produces errors.
