# Implementation Plan: Create Supabase Seed Data and Docker Files

**Branch**: `001-create-supabase-seed` | **Date**: 2024-09-13 | **Spec**: [spec.md](/Users/dallas/Development/betanxt-issuer-portal/specs/001-create-supabase-seed/spec.md)
**Input**: Feature specification from `/specs/001-create-supabase-seed/spec.md`

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

Create comprehensive seed data for the Issuer Portal to demonstrate the complete shareholder meeting lifecycle across 4 companies (Wendy's, Paycom, Woodward, Enliven Therapeutics) in different phases. Generate realistic meeting data, position/voting data based on historical Wendy's patterns, document workflows, task completion patterns, and user activity logs. Include Docker configuration for easy database setup and seeding.

## Technical Context

**Language/Version**: TypeScript with Node.js 18+  
**Primary Dependencies**: Prisma ORM, PostgreSQL, Docker, CSV parsing libraries  
**Storage**: PostgreSQL database with Prisma schema  
**Testing**: Playwright for integration tests  
**Target Platform**: Development environment (Docker containers)
**Project Type**: web (existing Next.js frontend + Express backend)  
**Performance Goals**: Seed data generation within 30 seconds, support for 100k+ position records  
**Constraints**: Must match existing Prisma schema exactly, realistic data patterns from historical Wendy's data  
**Scale/Scope**: 5 accounts, 4 companies, ~20 meetings across different phases, 10k+ position records, document workflows

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Simplicity**:

- Projects: 2 (seed-data library + docker setup)
- Using framework directly? YES (Prisma ORM directly, no wrappers)
- Single data model? YES (Prisma schema as single source of truth)
- Avoiding patterns? YES (direct database operations, no repository pattern)

**Architecture**:

- EVERY feature as library? YES (seed-data as standalone library)
- Libraries listed: seed-data-generator (CSV parsing + database seeding)
- CLI per library: seed-data --help/--version/--format=json
- Library docs: llms.txt format planned? YES

**Testing (NON-NEGOTIABLE)**:

- RED-GREEN-Refactor cycle enforced? YES (tests for data validation first)
- Git commits show tests before implementation? YES
- Order: Contract→Integration→E2E→Unit strictly followed? YES
- Real dependencies used? YES (actual PostgreSQL database)
- Integration tests for: schema validation, seed data integrity, API compatibility
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:

- Structured logging included? YES (seed progress, data validation results)
- Frontend logs → backend? N/A (seed data generation only)
- Error context sufficient? YES (CSV parsing errors, constraint violations)

**Versioning**:

- Version number assigned? 1.0.0 (initial seed data implementation)
- BUILD increments on every change? YES
- Breaking changes handled? YES (schema compatibility tests)

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 2 (Web application) - existing Next.js frontend + Express backend structure

## Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:

   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: ✅ research.md completed - all technology decisions and patterns documented

## Phase 1: Design & Contracts

_Prerequisites: research.md complete_

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/bash/update-agent-context.sh copilot` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: ✅ data-model.md, ✅ /contracts/seed-data-api.yaml, ✅ quickstart.md completed

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P]
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:

- TDD order: Tests before implementation
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 20-25 numbered, ordered tasks in tasks.md focusing on:

- Docker setup and database configuration (3-4 tasks)
- Seed data library creation (5-6 tasks)
- CSV data parsing and processing (4-5 tasks)
- Data generation and validation (6-8 tasks)
- Integration testing and documentation (2-3 tasks)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

_These phases are beyond the scope of the /plan command_

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |

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
- [ ] Complexity deviations documented (none required)

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_
