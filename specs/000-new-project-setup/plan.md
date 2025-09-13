# Implementation Plan: New Project Setup

**Branch**: `000-new-project-setup` | **Date**: September 12, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/000-new-project-setup/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:

- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

Create a foundational React TypeScript application using Next.js with MUI 7.3.1 and @rolemodel/betanxt-design-system. Implement role-based authentication and event management features with modular architecture supporting incremental development.

## Technical Context

**Language/Version**: TypeScript 5.x with React 18+ and Next.js 14+  
**Primary Dependencies**: Next.js, React, MUI 7.3.1, @rolemodel/betanxt-design-system, NextAuth.js or similar  
**Storage**: PostgreSQL or similar relational database for user and event data  
**Testing**: Jest, React Testing Library, Playwright for E2E testing  
**Target Platform**: Web application (responsive design for desktop and mobile browsers)
**Project Type**: web (frontend + backend API routes)  
**Performance Goals**: <200ms page load, <100ms API response times, 60fps UI interactions  
**Constraints**: Must use BetaNXT design system, role-based access control, modular architecture  
**Scale/Scope**: Support for 1000+ concurrent users, multiple user roles, comprehensive event management

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Simplicity**:

- Projects: 2 (frontend Next.js app + backend API routes within same project)
- Using framework directly? (Yes - Next.js, React, MUI without unnecessary wrappers)
- Single data model? (Yes - unified TypeScript interfaces/types)
- Avoiding patterns? (No Repository/UoW - direct database access via ORM)

**Architecture**:

- EVERY feature as library? (Yes - auth, events, user management as separate modules)
- Libraries listed:
  - auth-lib: Authentication and authorization logic
  - event-lib: Event management CRUD operations
  - user-lib: User management and role handling
  - ui-lib: Shared UI components extending design system
- CLI per library: [auth-cli, event-cli, user-cli with --help/--version/--format]
- Library docs: llms.txt format planned? (Yes - for each library)

**Testing (NON-NEGOTIABLE)**:

- RED-GREEN-Refactor cycle enforced? (Yes - tests written first, must fail, then implement)
- Git commits show tests before implementation? (Yes - commit strategy enforced)
- Order: Contract→Integration→E2E→Unit strictly followed? (Yes)
- Real dependencies used? (Yes - actual database, not mocks for integration tests)
- Integration tests for: new libraries, contract changes, shared schemas? (Yes)
- FORBIDDEN: Implementation before test, skipping RED phase (Enforced)

**Observability**:

- Structured logging included? (Yes - Winston or similar with JSON format)
- Frontend logs → backend? (Yes - centralized logging endpoint)
- Error context sufficient? (Yes - error boundaries and detailed error reporting)

**Versioning**:

- Version number assigned? (1.0.0 - MAJOR.MINOR.BUILD)
- BUILD increments on every change? (Yes - automated via CI/CD)
- Breaking changes handled? (Yes - parallel tests, migration plan)

## Project Structure

### Documentation (this feature)

```
specs/000-new-project-setup/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```
# Option 2: Web application (frontend + backend detected)
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

tests/
├── contract/          # API contract tests
├── integration/       # Integration tests
├── e2e/              # End-to-end tests
└── unit/             # Unit tests

public/               # Static assets
├── icons/
└── images/

docs/                 # Library documentation
├── auth/
├── events/
└── users/
```

**Structure Decision**: Option 2 (Web application) - Next.js full-stack application with API routes

## Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:

   - Research Next.js 14+ best practices for full-stack applications
   - Investigate @rolemodel/betanxt-design-system integration patterns
   - Research role-based authentication implementation with NextAuth.js
   - Evaluate database ORM options (Prisma, Drizzle, etc.)
   - Research testing strategies for Next.js applications

2. **Generate and dispatch research agents**:

   ```
   Task: "Research Next.js 14+ app directory structure and API routes best practices"
   Task: "Find integration patterns for MUI 7.3.1 with custom design systems"
   Task: "Research role-based authentication implementation in Next.js applications"
   Task: "Evaluate TypeScript ORM options for PostgreSQL integration"
   Task: "Find testing strategies for full-stack Next.js applications"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts

_Prerequisites: research.md complete_

1. **Extract entities from feature spec** → `data-model.md`:

   - User: id, email, name, role, createdAt, updatedAt
   - Role: id, name, permissions, description
   - Event: id, title, description, startDate, endDate, createdBy, attendees
   - Session: id, userId, token, expiresAt
   - Permission: id, name, resource, action

2. **Generate API contracts** from functional requirements:

   - Authentication endpoints: POST /api/auth/login, POST /api/auth/logout
   - User management: GET/POST/PUT/DELETE /api/users
   - Event management: GET/POST/PUT/DELETE /api/events
   - Role management: GET/POST/PUT/DELETE /api/roles
   - Output OpenAPI schema to `/contracts/`

3. **Generate contract tests** from contracts:

   - One test file per endpoint group
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:

   - Project initialization → quickstart test
   - Role-based access → integration test scenarios
   - Event management → user story validation

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/bash/update-agent-context.sh claude` for Claude
   - Add Next.js, React, TypeScript, MUI context
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root as CLAUDE.md

**Output**: data-model.md, /contracts/\*, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each API contract → contract test task [P]
- Each entity → TypeScript interface + database schema task [P]
- Each user story → integration test task
- Implementation tasks to make tests pass
- Setup tasks for project initialization, dependencies, configuration

**Ordering Strategy**:

- TDD order: Tests before implementation
- Dependency order: Database schema → Models → API routes → UI components
- Mark [P] for parallel execution (independent files)
- Setup tasks first: project init, dependencies, configuration

**Estimated Output**: 35-40 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

_These phases are beyond the scope of the /plan command_

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

No constitutional violations identified. The design follows all constitutional principles:

- Simple architecture with minimal projects
- Library-first approach for features
- Test-first development enforced
- Proper observability and versioning

## Progress Tracking

_This checklist is updated during execution flow_

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_
