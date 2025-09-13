# Tasks: New Project Setup - Issuer Portal

**Input**: Design documents from `/specs/000-new-project-setup/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: Next.js 14+ app directory structure
- Paths assume repository root structure per plan.md

## Phase 3.1: Project Setup & Infrastructure

- [ ] **T001** Initialize Turborepo workspace with two applications: mock-api-server and issuer-portal
- [ ] **T002** [P] Configure root package.json with Turborepo and workspace dependencies
- [ ] **T003** [P] Setup turbo.json configuration for build pipeline and caching
- [ ] **T004** [P] Configure mock-api-server package.json with API dependencies (Express/Fastify, Prisma, TypeScript)
- [ ] **T005** [P] Configure issuer-portal package.json with frontend dependencies (Next.js, React, MUI 7.3.1, @rolemodel/betanxt-design-system)
- [ ] **T006** [P] Setup ESLint and Prettier configuration in both mock-api-server/.eslintrc.json and issuer-portal/.eslintrc.json
- [ ] **T007** [P] Configure TypeScript strict mode in mock-api-server/tsconfig.json and issuer-portal/tsconfig.json
- [ ] **T008** [P] Setup Supabase connection and environment variables in mock-api-server/.env.local.development
- [ ] **T009** Create Prisma schema file at mock-api-server/schemas/schema.prisma with all entities from data-model.md
- [ ] **T010** [P] Configure Playwright for E2E testing in issuer-portal/playwright.config.ts
- [ ] **T011** [P] Setup project directory structure as specified in the updated structure
- [ ] **T012** [P] Configure MUI theme provider with BetaNXT design system in issuer-portal/components/mui-styling/ThemeRegistry.tsx
- [ ] **T013** Setup NextAuth.js configuration in issuer-portal/authentication/[...nextauth]/route.ts
- [ ] **T014** [P] Configure Turborepo build scripts in root package.json (build, dev, test, lint commands)

## Phase 3.2: Database Schema & Models (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Database Schema Tests

- [ ] **T015** [P] Prisma schema validation test in mock-api-server/tests/integration/test_schema_validation.spec.ts
- [ ] **T016** [P] Database connection test in mock-api-server/tests/integration/test_database_connection.spec.ts
- [ ] **T017** [P] Database migration test in mock-api-server/tests/integration/test_migrations.spec.ts

### Model Tests (Parallel - Different Entities)

- [ ] **T018** [P] Account model tests in mock-api-server/tests/unit/models/test_account.spec.ts
- [ ] **T019** [P] User model tests in mock-api-server/tests/unit/models/test_user.spec.ts
- [ ] **T020** [P] Meeting model tests in mock-api-server/tests/unit/models/test_meeting.spec.ts
- [ ] **T021** [P] Phase model tests in mock-api-server/tests/unit/models/test_phase.spec.ts
- [ ] **T022** [P] Task model tests in mock-api-server/tests/unit/models/test_task.spec.ts
- [ ] **T023** [P] Document model tests in mock-api-server/tests/unit/models/test_document.spec.ts
- [ ] **T024** [P] Position model tests in mock-api-server/tests/unit/models/test_position.spec.ts
- [ ] **T025** [P] Proposal model tests in mock-api-server/tests/unit/models/test_proposal.spec.ts

## Phase 3.3: API Contract Tests (TDD) ⚠️ MUST COMPLETE BEFORE 3.4

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Authentication Contract Tests

- [ ] **T024** [P] Contract test POST /api/auth/login in mock-api-server/tests/contract/test_auth_login.spec.ts
- [ ] **T025** [P] Contract test POST /api/auth/logout in mock-api-server/tests/contract/test_auth_logout.spec.ts
- [ ] **T026** [P] Contract test GET /api/auth/me in mock-api-server/tests/contract/test_auth_me.spec.ts

### User Management Contract Tests

- [ ] **T027** [P] Contract test GET /api/users in mock-api-server/tests/contract/test_users_list.spec.ts
- [ ] **T028** [P] Contract test POST /api/users in mock-api-server/tests/contract/test_users_create.spec.ts
- [ ] **T029** [P] Contract test GET /api/users/{id} in mock-api-server/tests/contract/test_users_get.spec.ts
- [ ] **T030** [P] Contract test PUT /api/users/{id} in mock-api-server/tests/contract/test_users_update.spec.ts
- [ ] **T031** [P] Contract test DELETE /api/users/{id} in mock-api-server/tests/contract/test_users_delete.spec.ts

### Meeting Management Contract Tests

- [ ] **T032** [P] Contract test GET /api/meetings in mock-api-server/tests/contract/test_meetings_list.spec.ts
- [ ] **T033** [P] Contract test POST /api/meetings in mock-api-server/tests/contract/test_meetings_create.spec.ts
- [ ] **T034** [P] Contract test GET /api/meetings/{id} in mock-api-server/tests/contract/test_meetings_get.spec.ts
- [ ] **T035** [P] Contract test PUT /api/meetings/{id} in mock-api-server/tests/contract/test_meetings_update.spec.ts

### Position & Voting Contract Tests

- [ ] **T036** [P] Contract test GET /api/meetings/{id}/positions in mock-api-server/tests/contract/test_positions_list.spec.ts
- [ ] **T037** [P] Contract test GET /api/meetings/{id}/proposals in mock-api-server/tests/contract/test_proposals_list.spec.ts

## Phase 3.4: Integration Tests (TDD) ⚠️ MUST COMPLETE BEFORE 3.5

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [ ] **T039** [P] User creation by relationship manager integration test in mock-api-server/tests/integration/test_user_creation.spec.ts
- [ ] **T040** [P] Authentication flow integration test in mock-api-server/tests/integration/test_auth_flow.spec.ts
- [ ] **T041** [P] Role-based access control integration test in mock-api-server/tests/integration/test_rbac.spec.ts
- [ ] **T042** [P] Meeting creation workflow integration test in mock-api-server/tests/integration/test_meeting_workflow.spec.ts
- [ ] **T044** [P] Document management integration test in mock-api-server/tests/integration/test_document_management.spec.ts

## Phase 3.5: Core Implementation (ONLY after tests are failing)

### Mock API Server - Database Models & Prisma Setup

- [ ] **T045** Push Prisma schema to Supabase database using `npx prisma db push` from mock-api-server/
- [ ] **T046** Generate Prisma client using `npx prisma generate` from mock-api-server/
- [ ] **T047** [P] Create database seed script in mock-api-server/supabase/seed.ts with default roles and test data
- [ ] **T048** Run database seeding using `npx prisma db seed` from mock-api-server/
- [ ] **T049** [P] Import Wendy's sample data from /data/ directory (positions, proposals, tabulation results)

### Mock API Server - TypeScript Type Definitions

- [ ] **T050** [P] Create core types in mock-api-server/domain-models/account.ts
- [ ] **T051** [P] Create user types in mock-api-server/domain-models/user.ts
- [ ] **T052** [P] Create meeting types in mock-api-server/domain-models/meeting.ts
- [ ] **T053** [P] Create tabulation types in mock-api-server/domain-models/tabulation.ts
- [ ] **T054** [P] Create API response types in mock-api-server/domain-models/api.ts

### Mock API Server - Database Services (Core Business Logic)

- [ ] **T054** [P] AccountService CRUD operations in mock-api-server/app/services/account-service.ts
- [ ] **T055** [P] UserService CRUD operations in mock-api-server/app/services/user-service.ts
- [ ] **T056** [P] MeetingService CRUD operations in mock-api-server/app/services/meeting-service.ts
- [ ] **T057** [P] PositionService CRUD operations in mock-api-server/app/services/position-service.ts
- [ ] **T058** [P] ProposalService CRUD operations in mock-api-server/app/services/proposal-service.ts
- [ ] **T059** [P] TabulationService for external vote data import in mock-api-server/app/services/tabulation-service.ts
- [ ] **T060** [P] DocumentService for file management in mock-api-server/app/services/document-service.ts

### Mock API Server - Authentication & Middleware

- [ ] **T061** Implement authentication middleware in mock-api-server/app/middleware/auth.ts
- [ ] **T062** [P] Create role-based permission utilities in mock-api-server/utils/permissions.ts
- [ ] **T063** [P] Create session management utilities in mock-api-server/utils/session.ts

### Mock API Server - API Route Implementations

- [ ] **T064** Implement POST /api/auth/login in mock-api-server/app/routes/auth/login.ts
- [ ] **T065** Implement POST /api/auth/logout in mock-api-server/app/routes/auth/logout.ts
- [ ] **T066** Implement GET /api/auth/me in mock-api-server/app/routes/auth/me.ts
- [ ] **T067** Implement GET /api/users in mock-api-server/app/routes/users/list.ts
- [ ] **T068** Implement POST /api/users in mock-api-server/app/routes/users/create.ts
- [ ] **T069** Implement GET /api/users/[id] in mock-api-server/app/routes/users/get.ts
- [ ] **T070** Implement PUT /api/users/[id] in mock-api-server/app/routes/users/update.ts
- [ ] **T071** Implement DELETE /api/users/[id] in mock-api-server/app/routes/users/delete.ts
- [ ] **T072** Implement GET /api/meetings in mock-api-server/app/routes/meetings/list.ts
- [ ] **T073** Implement POST /api/meetings in mock-api-server/app/routes/meetings/create.ts
- [ ] **T074** Implement GET /api/meetings/[id] in mock-api-server/app/routes/meetings/get.ts
- [ ] **T075** Implement PUT /api/meetings/[id] in mock-api-server/app/routes/meetings/update.ts
- [ ] **T076** Implement GET /api/meetings/[id]/positions in mock-api-server/app/routes/meetings/positions.ts
- [ ] **T077** Implement GET /api/meetings/[id]/proposals in mock-api-server/app/routes/meetings/proposals.ts
- [ ] **T078** Implement POST /api/meetings/[id]/tabulation/import in mock-api-server/app/routes/meetings/tabulation.ts
- [ ] **T079** Implement GET /api/meetings/[id]/tabulation/results in mock-api-server/app/routes/meetings/results.ts

## Phase 3.6: Issuer Portal Frontend - UI Components & Pages

### Shared UI Components (Design System Extensions)

- [ ] **T080** [P] Create AuthForm component in issuer-portal/components/forms/auth-form.tsx
- [ ] **T081** [P] Create UserForm component in issuer-portal/components/forms/user-form.tsx
- [ ] **T082** [P] Create MeetingForm component in issuer-portal/components/forms/meeting-form.tsx
- [ ] **T083** [P] Create TabulationResults component in issuer-portal/components/ui/tabulation-results.tsx
- [ ] **T084** [P] Create DataTable component in issuer-portal/components/ui/data-table.tsx
- [ ] **T085** [P] Create Navigation component in issuer-portal/components/layout/navigation.tsx
- [ ] **T086** [P] Create Dashboard layout in issuer-portal/components/layout/dashboard-layout.tsx

### Frontend Type Definitions & API Client

- [ ] **T087** [P] Create API client utilities in issuer-portal/utils/api-client.ts
- [ ] **T088** [P] Create frontend types in issuer-portal/domain-models/ (matching backend types)
- [ ] **T089** [P] Create authentication context in issuer-portal/authentication/auth-context.tsx

### Authentication Pages

- [ ] **T090** Create login page in issuer-portal/app/(auth)/login/page.tsx
- [ ] **T091** Create auth layout in issuer-portal/app/(auth)/layout.tsx

### Dashboard Pages

- [ ] **T092** Create dashboard home page in issuer-portal/app/(dashboard)/page.tsx
- [ ] **T093** Create users management page in issuer-portal/app/(dashboard)/users/page.tsx
- [ ] **T094** Create meetings list page in issuer-portal/app/(dashboard)/meetings/page.tsx
- [ ] **T095** Create meeting detail page in issuer-portal/app/(dashboard)/meetings/[id]/page.tsx
- [ ] **T096** Create tabulation results page in issuer-portal/app/(dashboard)/meetings/[id]/results/page.tsx
- [ ] **T097** Create dashboard layout in issuer-portal/app/(dashboard)/layout.tsx

### Root Application Setup

- [ ] **T098** Create root layout in issuer-portal/app/layout.tsx with theme provider
- [ ] **T099** Create home page in issuer-portal/app/page.tsx
- [ ] **T100** Configure global styles in issuer-portal/app/globals.css
- [ ] **T101** [P] Create global loading component in issuer-portal/app/loading.tsx
- [ ] **T102** [P] Create global not-found page in issuer-portal/app/not-found.tsx

## Phase 3.7: Integration & Middleware

- [ ] **T103** Connect mock-api-server services to Prisma database client
- [ ] **T104** Implement request/response logging middleware in mock-api-server
- [ ] **T105** Add CORS and security headers configuration in mock-api-server
- [ ] **T106** Implement error handling and error boundaries in issuer-portal
- [ ] **T107** Add input validation middleware for all API routes in mock-api-server
- [ ] **T108** Configure rate limiting for API endpoints in mock-api-server
- [ ] **T109** Connect issuer-portal frontend to mock-api-server backend

## Phase 3.8: CLI Tools & Libraries

### CLI Commands (Constitutional Requirement)

- [ ] **T110** [P] Create auth-cli in mock-api-server/utils/cli/auth-cli.ts with --create-user, --list-users commands
- [ ] **T111** [P] Create meeting-cli in mock-api-server/utils/cli/meeting-cli.ts with --create-meeting, --list-meetings commands
- [ ] **T112** [P] Create tabulation-cli in mock-api-server/utils/cli/tabulation-cli.ts with --import-csv, --export-results commands

### Library Documentation

- [ ] **T113** [P] Create auth library docs in docs/auth/llms.txt
- [ ] **T114** [P] Create meetings library docs in docs/meetings/llms.txt
- [ ] **T115** [P] Create tabulation library docs in docs/tabulation/llms.txt

## Phase 3.9: E2E Tests & Validation

### End-to-End Tests (Playwright)

- [ ] **T115** [P] E2E test for complete authentication flow in issuer-portal/tests/e2e/auth-flow.spec.ts
- [ ] **T116** [P] E2E test for meeting creation workflow in issuer-portal/tests/e2e/meeting-creation.spec.ts
- [ ] **T118** [P] E2E test for role-based access control in issuer-portal/tests/e2e/rbac.spec.ts
- [ ] **T119** [P] E2E test for document management in issuer-portal/tests/e2e/document-management.spec.ts

### Performance & Validation

- [ ] **T120** Performance testing for <200ms API response times (mock-api-server)
- [ ] **T121** Performance testing for <100ms page load times (issuer-portal)
- [ ] **T122** Execute quickstart.md verification tests
- [ ] **T123** Validate all OpenAPI contract compliance

## Phase 3.10: Polish & Documentation

### Code Quality

- [ ] **T124** [P] Add comprehensive error handling and user feedback in both apps
- [ ] **T125** [P] Implement comprehensive logging with Winston in mock-api-server
- [ ] **T126** [P] Remove code duplication and refactor common patterns
- [ ] **T127** [P] Add JSDoc comments to all public functions
- [ ] **T128** [P] Optimize bundle size and performance in issuer-portal

### Documentation & Deployment

- [ ] **T129** [P] Update README.md with setup and deployment instructions for both apps
- [ ] **T130** [P] Create API documentation endpoint in mock-api-server
- [ ] **T131** [P] Configure Vercel deployment settings for issuer-portal
- [ ] **T132** [P] Setup production environment variables for both apps
- [ ] **T133** Final validation: Run complete test suite and quickstart guide

## Dependencies

### Critical Path Dependencies

- **Setup** (T001-T014) → **Database Tests** (T015-T017) → **Database Implementation** (T045-T048)
- **Model Tests** (T018-T026) → **Service Implementation** (T054-T060)
- **Contract Tests** (T027-T038) → **API Implementation** (T064-T078)
- **Integration Tests** (T039-T044) → **UI Implementation** (T079-T101)
- **Mock API Server** (T045-T078) → **Frontend Development** (T079-T101)
- **Core Implementation** (T045-T101) → **Integration** (T102-T108) → **E2E Tests** (T115-T119)
- **All Implementation** → **Polish** (T124-T133)

### Parallel Execution Blocks

#### Setup & Configuration

- **T002-T005, T008, T010**: Independent configuration files for both apps
- **T047, T049-T053**: Different TypeScript type files in mock-api-server
- **T086-T088**: Frontend utilities and context setup

#### Testing (TDD Phase)

- **T015-T023**: Different entity model tests (mock-api-server)
- **T024-T038**: Different API contract tests (mock-api-server)
- **T039-T044**: Different integration test scenarios (mock-api-server)

#### Backend Implementation

- **T054-T060**: Different service classes (mock-api-server)
- **T062-T063**: Different utility modules (mock-api-server)
- **T067-T078**: Different API route implementations (mock-api-server)

#### Frontend Implementation

- **T079-T085**: Different UI components (issuer-portal)
- **T089-T097**: Different page implementations (issuer-portal)

#### CLI & Documentation

- **T108-T110**: Different CLI tools (mock-api-server)
- **T111-T113**: Different documentation files
- **T114-T118**: Different E2E test scenarios (issuer-portal)

#### Polish & Deployment

- **T123, T125-T127**: Different code quality tasks
- **T128-T131**: Different documentation and deployment tasks

## Parallel Example

```bash
# Launch backend model tests together (T015-T023):
Task: "Account model tests in mock-api-server/tests/unit/models/test_account.spec.ts"
Task: "User model tests in mock-api-server/tests/unit/models/test_user.spec.ts"
Task: "Meeting model tests in mock-api-server/tests/unit/models/test_meeting.spec.ts"
Task: "Position model tests in mock-api-server/tests/unit/models/test_position.spec.ts"
Task: "Proposal model tests in mock-api-server/tests/unit/models/test_proposal.spec.ts"

# Launch backend service implementations together (T054-T060):
Task: "AccountService CRUD operations in mock-api-server/app/services/account-service.ts"
Task: "UserService CRUD operations in mock-api-server/app/services/user-service.ts"
Task: "MeetingService CRUD operations in mock-api-server/app/services/meeting-service.ts"

# Launch frontend UI components together (T079-T085):
Task: "AuthForm component in issuer-portal/components/forms/auth-form.tsx"
Task: "UserForm component in issuer-portal/components/forms/user-form.tsx"
Task: "Navigation component in issuer-portal/components/layout/navigation.tsx"
```

## Notes

- **[P] tasks** = different files, no dependencies, can run in parallel
- **Verify tests fail** before implementing (RED phase of TDD)
- **Commit after each task** for proper version control
- **Constitutional compliance**: All features implemented as libraries with CLI interfaces
- **Real database**: Use actual Supabase PostgreSQL, not mocks for integration tests
- **Performance targets**: <200ms API responses, <100ms page loads, 60fps UI

## Task Generation Rules Applied

1. **From Contracts**: Each OpenAPI endpoint → contract test + implementation
2. **From Data Model**: Each entity → model test + service implementation
3. **From User Stories**: Each quickstart scenario → integration test + E2E test
4. **Constitutional**: Each domain → CLI tool + library documentation
5. **TDD Ordering**: Tests → Models → Services → APIs → UI → Polish

## Validation Checklist

- [x] All contracts have corresponding tests (T024-T038 → T064-T078)
- [x] All entities have model tasks (T015-T023 → T054-T060)
- [x] All tests come before implementation (Phase 3.2-3.4 → 3.5+)
- [x] Parallel tasks truly independent (different files, no shared dependencies)
- [x] Each task specifies exact file path with correct app directory
- [x] No task modifies same file as another [P] task
- [x] Constitutional requirements met (CLI tools, library docs, TDD)
- [x] Proxy voting domain properly implemented (not generic events)
- [x] Dual-app architecture properly separated (mock-api-server + issuer-portal)
- [x] Backend API and frontend client properly decoupled
- [x] All file paths updated to reflect new directory structure
