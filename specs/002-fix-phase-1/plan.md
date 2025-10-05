# Implementation Plan: Phase Management & Digital Shareholder Meeting Enhancements

**Branch**: `002-fix-phase-1` | **Date**: October 4, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-fix-phase-1/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → ✅ LOADED: Multiple fixes and enhancements identified
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → ✅ DETECTED: Next.js web application with React frontend + mock API backend
   → ✅ SET: Web application structure (Option 2)
3. Evaluate Constitution Check section below
   → ✅ PASS: Existing codebase modifications, minimal new complexity
   → ✅ UPDATE: Initial Constitution Check complete
4. Execute Phase 0 → research.md
   → ✅ COMPLETE: Research findings documented
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
   → ✅ COMPLETE: Design artifacts created
6. Re-evaluate Constitution Check section
   → ✅ PASS: No new violations introduced
   → ✅ UPDATE: Post-Design Constitution Check complete
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
   → ✅ COMPLETE: Task strategy defined below
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:

- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

Primary requirement: Fix critical issues in phase management system including auto-advancement, UI scrolling problems, document synchronization, broken reports, and implement comprehensive Digital Shareholder Meeting participant management with role-based sections and downloadable attendee lists.

Technical approach: Enhance existing Next.js/React/MUI application with improved state management for phase transitions, CSS fixes for scrolling issues, real-time document synchronization, report system restoration, and new DSM components with data export capabilities.

## Technical Context

**Language/Version**: TypeScript 5.9.2, React 19.1.1, Next.js 15.5.4  
**Primary Dependencies**: MUI v7.3.2, Next-Auth 5.0.0, Supabase 2.58.0, Framer Motion 12.23.22  
**Storage**: Supabase (PostgreSQL) with real-time subscriptions  
**Testing**: Playwright for E2E, Jest/React Testing Library for unit tests  
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge)  
**Project Type**: Web application (frontend + backend API)  
**Performance Goals**: <200ms page transitions, <100ms document sync, real-time updates  
**Constraints**: Maintain existing design system, preserve user data, backward compatibility  
**Scale/Scope**: Multi-tenant SaaS, 1000+ concurrent users, 10k+ documents per meeting

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Simplicity**:

- Projects: 2 (issuer-portal frontend, mock-api-server backend) - ✅ Under max 3
- Using framework directly? ✅ Yes - Direct MUI, Next.js, Supabase usage
- Single data model? ✅ Yes - Shared types between frontend/backend
- Avoiding patterns? ✅ Yes - No unnecessary abstractions, direct component patterns

**Architecture**:

- EVERY feature as library? ✅ Yes - Components, hooks, utils as reusable libraries
- Libraries listed:
  - Phase management utilities (state transitions, validation)
  - Document sync services (upload handling, display synchronization)
  - DSM participant management (role handling, data export)
  - Report generation utilities (data processing, export functions)
- CLI per library: N/A - Web application components
- Library docs: ✅ Yes - Component documentation in Storybook format

**Testing (NON-NEGOTIABLE)**:

- RED-GREEN-Refactor cycle enforced? ✅ Yes - Tests written before implementation
- Git commits show tests before implementation? ✅ Yes - Failing tests committed first
- Order: Contract→Integration→E2E→Unit strictly followed? ✅ Yes
- Real dependencies used? ✅ Yes - Actual Supabase, real document uploads
- Integration tests for: ✅ Phase transitions, document sync, DSM functionality
- FORBIDDEN: ✅ No implementation before failing tests

**Observability**:

- Structured logging included? ✅ Yes - Console logging with structured data
- Frontend logs → backend? ✅ Yes - Error reporting to backend
- Error context sufficient? ✅ Yes - User actions, component state, error boundaries

**Versioning**:

- Version number assigned? ✅ Yes - 1.1.0 (minor feature additions)
- BUILD increments on every change? ✅ Yes - Automated via CI/CD
- Breaking changes handled? ✅ Yes - Backward compatible enhancements only

## Project Structure

### Documentation (this feature)

```
specs/002-fix-phase-1/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```
# Option 2: Web application (SELECTED - frontend + backend detected)
issuer-portal/                    # Frontend Next.js application
├── components/
│   ├── Meeting/                 # Phase management components
│   │   ├── PhaseTransition.tsx
│   │   ├── Phase7Dashboard.tsx
│   │   └── DigitalShareholderMeeting.tsx
│   ├── Documents/               # Document management
│   │   ├── MeetingDocuments.tsx
│   │   └── DocumentSync.tsx
│   └── Reports/                 # Report functionality
│       └── ReportGenerator.tsx
├── hooks/                       # Custom React hooks
│   ├── usePhaseManagement.ts
│   ├── useDocumentSync.ts
│   └── useDSMParticipants.ts
├── utils/                       # Utility functions
│   ├── phaseValidation.ts
│   ├── documentSync.ts
│   └── exportUtils.ts
└── tests/
    ├── integration/             # Component integration tests
    ├── e2e/                    # Playwright end-to-end tests
    └── unit/                   # Jest unit tests

mock-api-server/                  # Backend API
├── app/
│   ├── phases/                 # Phase management endpoints
│   ├── documents/              # Document handling endpoints
│   ├── reports/                # Report generation endpoints
│   └── dsm/                    # DSM participant endpoints
├── domain-models/              # Shared type definitions
└── tests/
    ├── contract/               # API contract tests
    ├── integration/            # Database integration tests
    └── unit/                   # Business logic unit tests
```

**Structure Decision**: Option 2 (Web application) - frontend + backend structure already established

## Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - Phase transition criteria and validation logic
   - Document synchronization mechanisms in real-time
   - Report system architecture and failure points
   - DSM participant role management patterns
   - Data export formats and performance requirements

2. **Generate and dispatch research agents**:

   ```
   Task: "Research Next.js state management patterns for phase transitions"
   Task: "Find best practices for real-time document synchronization with Supabase"
   Task: "Research MUI scrolling issues and CSS solutions for Phase 7 dashboard"
   Task: "Find report generation patterns in React applications"
   Task: "Research data export formats for attendee lists (CSV, Excel, PDF)"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all technical approaches resolved

## Phase 1: Design & Contracts

_Prerequisites: research.md complete_

1. **Extract entities from feature spec** → `data-model.md`:
   - Phase (status, tasks, completion_criteria, transition_rules)
   - Task (id, phase_id, status, completion_date, dependencies)
   - Document (id, filename, upload_status, sync_status, metadata)
   - Report (type, status, generation_date, parameters, output_format)
   - DSMParticipant (role, status, registration_data, attendance_data)
   - AttendeeList (type, format, generation_date, participant_count)

2. **Generate API contracts** from functional requirements:
   - Phase Management: GET/PUT /api/phases/{id}, POST /api/phases/{id}/advance
   - Document Sync: GET/POST /api/documents, PUT /api/documents/{id}/sync-status
   - Reports: GET/POST /api/reports, GET /api/reports/{id}/download
   - DSM: GET/POST/PUT /api/dsm/participants, GET /api/dsm/attendees/export
   - Output OpenAPI schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - Phase transition validation tests
   - Document upload and sync tests
   - Report generation and download tests
   - DSM participant management tests
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Phase auto-advance integration tests
   - Document sync end-to-end tests
   - DSM participant workflow tests
   - Report generation validation tests

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/bash/update-agent-context.sh claude` for Claude Code
   - Add phase management, document sync, DSM patterns
   - Preserve existing MUI, Next.js, Supabase context
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
- Each entity → model creation/update task [P]
- Each user story → integration test task
- Each component → unit test + implementation task
- CSS fixes → specific styling tasks [P]
- Data export → utility function tasks [P]

**Ordering Strategy**:

- TDD order: Tests before implementation
- Dependency order: Models → Services → Components → Integration
- Parallel tasks: Independent component fixes, CSS updates, utility functions
- Sequential tasks: Phase management (affects multiple components)
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 35-40 numbered, ordered tasks in tasks.md

**Task Categories**:

1. **Phase Management** (8-10 tasks): State management, validation, UI updates
2. **Document Synchronization** (6-8 tasks): Real-time sync, status updates, UI integration
3. **UI Fixes** (4-6 tasks): Phase 7 scrolling, CSS improvements, responsive design
4. **Report System** (6-8 tasks): Error handling, generation logic, download functionality
5. **DSM Features** (8-10 tasks): Participant management, role handling, data export
6. **Testing & Integration** (3-5 tasks): E2E tests, integration validation

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

_These phases are beyond the scope of the /plan command_

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

_No Constitution Check violations - existing codebase enhancements only_

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| None      | N/A        | N/A                                  |

## Progress Tracking

_This checklist is updated during execution flow_

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none required)

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_
