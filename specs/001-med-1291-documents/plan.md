# Implementation Plan: Shareholder Proxy Document Management (Phase 1 & Phase 2)

**Branch**: `001-med-1291-documents` | **Date**: 2025-09-21 | **Spec**: `/specs/001-med-1291-documents/spec.md`
**Input**: Feature specification from `/specs/001-med-1291-documents/spec.md`

## Summary

Phased delivery of a meeting-scoped document workflow: Phase 1 executes three generated compliance forms (digital or wet-sign upload) ensuring immutable executed artifacts; Phase 2 manages core proxy materials plus supporting shareholder documents with versioning, approval, and readiness computation. Approach centers on: (1) explicit state machines per document category, (2) readiness aggregation service, (3) audit & version traceability, (4) minimal storage abstraction enabling future external document API integration. Supabase provides initial storage for files & metadata.

## Technical Context

**Language/Version**: TypeScript (Next.js)  
**Primary Dependencies**: Next.js, React, Supabase client, MUI, (Future) digital signature provider [NEEDS CLARIFICATION: selection]  
**Storage**: Supabase Postgres (metadata) + Supabase Storage Buckets (binary)  
**Testing**: Playwright (E2E), Jest/Vitest (unit) [NEEDS CLARIFICATION: confirm], contract tests (supertest or fetch)  
**Target Platform**: Web (Issuer Portal)  
**Project Type**: Web (frontend + backend logic combined)  
**Performance Goals**: Metadata write <300ms p95; readiness compute <150ms p95; listing history <500ms p95 [NEEDS CLARIFICATION: confirm SLAs]  
**Constraints**: Executed forms immutable; audit of transitions; external API pluggability  
**Scale/Scope**: Initial: tens of meetings / hundreds of versions; growth path to thousands [NEEDS CLARIFICATION: scale target]

Outstanding Unknowns: provider choice, approval role taxonomy, file size limits, retention, supporting doc requiredness, correction workflow, watermarking, deadline rules, evidence hash standard, test runner confirmation.

## Constitution Check

**Simplicity**:

- Projects: 1 (reuse portal)
- Direct framework usage; avoid infra wrappers
- Single domain layer; no DTO explosion
- Minimal adapter planned but deferred until external integration (avoid premature complexity)

**Architecture**:

- Library-first deviation (module inside app) — justified by limited scope & speed
- Domain module: documents (state machine, validation, readiness calc)
- Potential CLI (readiness audit) deferred
- Documentation satisfied by spec + plan + generated design artifacts

**Testing (NON-NEGOTIABLE)**:

- Flow: Contracts (failing) → integration (state transitions/readiness) → E2E (Playwright) → unit validators
- Real Supabase for integration/E2E; stub only signature provider
- Each endpoint: contract test asserts schema & error codes
- Guard for RED step: initial commit includes failing tests prior to implementation (manual enforcement)

**Observability**:

- Structured events: form.generated, form.executed, document.uploaded, document.version.created, document.approved, readiness.computed
- Include correlation ids (meetingId, documentType, versionId, actor)
- Error responses: code + message + remediation hint

**Versioning**:

- Internal feature; migrations timestamp serve as trace
- Additive schema evolution only pre-GA
- No semantic version tagging yet

## Project Structure

**Structure Decision**: Web app; implement under `issuer-portal/domain-models/documents/` + API routes `issuer-portal/app/api/documents/`.

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

**Output**: research.md with all NEEDS CLARIFICATION resolved

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

**Output**: data-model.md, /contracts/\*, failing tests, quickstart.md, agent-specific file

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

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

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
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_
