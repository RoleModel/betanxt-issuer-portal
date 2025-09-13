# Issuer Portal - Claude Code Context

## Project Overview

**Project**: Issuer Portal - Event Management System  
**Architecture**: Next.js 14+ Full-Stack Web Application  
**Language**: TypeScript 5.x with React 18+  
**Database**: PostgreSQL with Prisma ORM  
**Authentication**: NextAuth.js with role-based access control  
**UI Framework**: MUI 7.3.1 with @rolemodel/betanxt-design-system  
**Testing**: Jest, React Testing Library, Playwright E2E

## Current Feature: New Project Setup (000-new-project-setup)

**Status**: Phase 1 Complete - Design artifacts generated  
**Branch**: `000-new-project-setup`  
**Spec**: `/specs/000-new-project-setup/spec.md`

### Key Requirements

- Foundational project structure supporting modular development
- Role-based authentication with multiple user types
- Event management CRUD functionality
- BetaNXT design system integration
- Responsive design for all device sizes
- Test-first development approach

### Architecture Decisions

- **Framework**: Next.js 14+ app directory structure
- **Database**: PostgreSQL with Prisma ORM for type safety
- **Authentication**: NextAuth.js v5 with custom role handling
- **State Management**: React Context + useReducer for global state, React Query for server state
- **Styling**: MUI 7.3.1 components with BetaNXT design system theme
- **Testing Strategy**: Multi-layer testing (Unit → Integration → E2E)

## Project Structure

```
src/
├── app/                 # Next.js 14+ app directory
│   ├── (auth)/         # Auth route group
│   ├── (dashboard)/    # Protected dashboard routes
│   ├── api/            # API routes
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # Shared UI components
│   ├── ui/            # Design system extensions
│   ├── forms/         # Form components
│   └── layout/        # Layout components
├── lib/               # Core libraries
│   ├── auth/          # Authentication library
│   ├── events/        # Event management library
│   ├── users/         # User management library
│   └── database/      # Database utilities
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── middleware.ts      # Next.js middleware
```

## Core Entities

### User

- Authentication and role-based access
- Fields: id, email, name, roleId, isActive, emailVerified
- Relationships: belongs to Role, creates Events, attends Events

### Role

- Permission sets and access levels
- Fields: id, name, description, isActive
- Default roles: Super Admin, Admin, Event Manager, User

### Event

- Core business entity for event management
- Fields: id, title, description, startDate, endDate, location, status
- Statuses: DRAFT, PUBLISHED, CANCELLED, COMPLETED

### Permission

- Granular access controls
- Format: "resource:action" (e.g., "events:create", "users:read")

## API Design

**Base URL**: `/api`  
**Authentication**: Bearer JWT tokens  
**Format**: RESTful JSON API following OpenAPI 3.0 specification

### Key Endpoints

- `POST /api/auth/login` - User authentication
- `GET /api/users` - List users (paginated)
- `GET /api/events` - List events with filtering
- `POST /api/events` - Create new event
- `POST /api/events/{id}/attendees` - Register for event

## Development Guidelines

### Code Style

- TypeScript strict mode enabled
- ESLint + Prettier for code formatting
- Functional components with hooks
- Custom hooks for business logic
- Error boundaries for error handling

### Testing Approach

- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: API route testing with test database
- **E2E Tests**: Playwright for user journey testing
- **TDD Workflow**: Red-Green-Refactor cycle enforced

### Authentication Flow

1. User submits credentials to `/api/auth/login`
2. Server validates and returns JWT token
3. Client stores token and includes in subsequent requests
4. Middleware validates token and role permissions
5. Protected routes check user permissions

### Permission System

- Permissions stored as "resource:action" strings
- Roles have many permissions through junction table
- Middleware checks permissions for protected routes
- UI components conditionally render based on permissions

## Design System Integration

**Theme Provider**: MUI ThemeProvider with BetaNXT design system  
**Component Pattern**: Extend MUI components with design system props  
**Styling Approach**: CSS-in-JS with emotion for runtime theming  
**Responsive Design**: MUI breakpoint system with mobile-first approach

### Key Components

- Navigation with role-based menu items
- Forms with validation and error handling
- Data tables with sorting and pagination
- Modal dialogs for CRUD operations
- Toast notifications for user feedback

## Recent Changes

1. **Phase 0 Complete**: Research decisions documented
   - Next.js 14+ app directory structure
   - Prisma ORM for database management
   - NextAuth.js for authentication
2. **Phase 1 Complete**: Design artifacts generated
   - Data model with 7 core entities
   - OpenAPI specification with 15+ endpoints
   - Quickstart guide with verification tests

## Next Steps (Phase 2)

- Generate detailed task breakdown in `tasks.md`
- Implement TDD workflow for each component
- Set up project structure and dependencies
- Create database schema and seed data
- Implement authentication system
- Build core UI components with design system

## Constitutional Compliance

✅ **Library-First**: Auth, Events, Users as separate modules  
✅ **CLI Interface**: Each library exposes CLI commands  
✅ **Test-First**: TDD workflow enforced, tests before implementation  
✅ **Simplicity**: Minimal projects (2), direct framework usage  
✅ **Observability**: Structured logging with Winston  
✅ **Versioning**: MAJOR.MINOR.BUILD format (1.0.0)

---

_Last Updated_: September 12, 2025  
_Feature Branch_: 000-new-project-setup  
_Phase_: 1 Complete (Design artifacts generated)
