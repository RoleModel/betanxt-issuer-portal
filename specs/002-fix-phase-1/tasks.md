# Tasks: Phase Management & DSM UI Fixes

**Input**: Design documents from `/specs/002-fix-phase-1/`  
**Prerequisites**: spec.md ✅, research.md ✅, CORRECTION_SUMMARY.md ✅

## Execution Flow (main)

```
1. Load spec.md from feature directory
   → ✅ LOADED: 7 bug fixes and UI enhancements identified
   → ✅ CONFIRMED: Frontend-only changes, backend exists
2. Load optional design documents:
   → ✅ research.md: React Context + useReducer, Supabase real-time
   → ✅ CORRECTION_SUMMARY.md: Confirmed no backend changes needed
   → ❌ data-model.md: Not needed (schema exists in OpenAPI)
   → ❌ contracts/: Not needed (endpoints already implemented)
3. Generate tasks by category:
   → ✅ Investigation: Reproduce bugs, document current behavior
   → ✅ Tests: E2E tests for each bug fix (TDD)
   → ✅ Bug Fixes: Phase auto-advance, scrolling, document sync, reports
   → ✅ Features: TabulationTracker, DSM UI reorganization, export
   → ✅ Polish: Performance, cross-browser testing, documentation
4. Apply task rules:
   → ✅ Different components = mark [P] for parallel
   → ✅ Same component = sequential (no [P])
   → ✅ Tests before fixes (TDD enforced)
5. Number tasks sequentially (T001-T028)
6. Generate dependency graph
7. Validate task completeness:
   → ✅ All bugs have E2E tests
   → ✅ All features have integration tests
   → ✅ Tests before implementation
9. Return: SUCCESS (28 tasks ready for execution)
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `issuer-portal/` (Next.js app)
- **Backend**: `mock-api-server/` (no changes needed)
- **Components**: `issuer-portal/components/Meeting/`
- **Tests**: `issuer-portal/tests/e2e/` and `issuer-portal/tests/integration/`

## Phase 3.1: Investigation & Setup (2 tasks)

- [ ] T001 Reproduce and document all 7 bugs/issues locally with screenshots and current behavior notes in specs/002-fix-phase-1/BUG_REPRODUCTION.md
- [ ] T002 [P] Verify existing API endpoints work correctly by testing phase, task, document, and DSM endpoints with sample requests

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### E2E Tests for Bug Fixes

- [ ] T003 [P] E2E test phase auto-advance from Phase 1 to Phase 2 after all tasks complete in issuer-portal/tests/e2e/phase-auto-advance.spec.ts
- [ ] T004 [P] E2E test Phase 7 dashboard scrolling behavior across viewport sizes in issuer-portal/tests/e2e/phase7-scrolling.spec.ts
- [ ] T005 [P] E2E test document upload appears in MeetingDocuments after Taskbar upload in issuer-portal/tests/e2e/document-sync.spec.ts
- [ ] T006 [P] E2E test reports generation and display functionality in issuer-portal/tests/e2e/reports-functionality.spec.ts

### Integration Tests for New Features

- [ ] T007 [P] Integration test TabulationTracker displays vote data correctly in issuer-portal/tests/integration/tabulation-tracker.spec.ts
- [ ] T008 [P] Integration test DSM UI 3-section layout with role filtering in issuer-portal/tests/integration/dsm-ui-sections.spec.ts
- [ ] T009 [P] Integration test attendee list export in CSV, Excel, PDF formats in issuer-portal/tests/integration/attendee-export.spec.ts

## Phase 3.3: Bug Fixes (ONLY after tests are failing)

### Phase Auto-Advance Logic

- [ ] T010 Create PhaseContext provider with useReducer for phase state management in issuer-portal/contexts/PhaseContext.tsx
- [ ] T011 Add phase transition validation hook in issuer-portal/hooks/usePhaseTransition.ts
- [ ] T012 Implement auto-advance logic that triggers when all phase tasks are complete in issuer-portal/components/Meeting/PhaseManager.tsx

### Phase 7 Dashboard Scrolling

- [ ] T013 Fix Phase 7 dashboard CSS layout using CSS Grid with proper overflow handling in issuer-portal/app/[clientTicker]/meeting/[meetingId]/dashboard/Phase%207/page.tsx

### Document Upload Synchronization

- [ ] T014 Add Supabase real-time subscription for document updates in issuer-portal/hooks/useDocumentSync.ts
- [ ] T015 Update Taskbar document uploader to trigger sync after successful upload in issuer-portal/components/Meeting/Taskbar/DocumentUpload.tsx
- [ ] T016 Update MeetingDocuments to listen for real-time document updates in issuer-portal/components/Meeting/MeetingDocuments.tsx

### Reports Functionality Fix

- [ ] T017 Investigate and document specific reports errors in specs/002-fix-phase-1/REPORTS_INVESTIGATION.md
- [ ] T018 Fix identified report generation issues (specific tasks determined after T017)

## Phase 3.4: New Features

### TabulationTracker Component

- [ ] T019 [P] Create TabulationTracker component with vote metrics display in issuer-portal/components/Meeting/Tabulation/TabulationTracker.tsx
- [ ] T020 Integrate TabulationTracker into Tabulation page in issuer-portal/app/[clientTicker]/meeting/[meetingId]/tabulation/page.tsx

### DSM UI Reorganization

- [ ] T021 Create DSMParticipants section component with role columns in issuer-portal/components/Meeting/DigitalShareholderMeeting/DSMParticipants.tsx
- [ ] T022 Create DSMGuestRegistrants section component in issuer-portal/components/Meeting/DigitalShareholderMeeting/DSMGuestRegistrants.tsx
- [ ] T023 Create DSMActualAttendees section component (post-meeting) in issuer-portal/components/Meeting/DigitalShareholderMeeting/DSMActualAttendees.tsx
- [ ] T024 Integrate 3-section DSM layout in Digital Shareholder Meeting page in issuer-portal/app/[clientTicker]/meeting/[meetingId]/digital-shareholder-meeting/page.tsx

### Attendee List Export

- [ ] T025 [P] Create export utility supporting CSV, Excel, PDF formats in issuer-portal/utils/attendeeExport.ts
- [ ] T026 Add export buttons to each DSM section with download functionality in issuer-portal/components/Meeting/DigitalShareholderMeeting/ExportButton.tsx

## Phase 3.5: Polish & Documentation

- [ ] T027 [P] Add React.memo optimizations to DSM components and virtual scrolling for large attendee lists
- [ ] T028 [P] Update component documentation and user guide in docs/ with new DSM features and bug fix notes

## Dependencies

### Sequential (Must Complete in Order)

- T001 (investigation) → T003-T009 (tests can reference bugs)
- T003-T009 (tests) → T010-T026 (implementation after tests fail)
- T010-T011 → T012 (context/hook before PhaseManager)
- T014 → T015, T016 (sync hook before components)
- T017 → T018 (investigation before fix)
- T021-T023 → T024 (section components before integration)
- T025 → T026 (export utility before buttons)
- T010-T026 (implementation) → T027-T028 (polish after features)

### Parallel (Can Run Together)

- T003, T004, T005, T006 (different E2E tests)
- T007, T008, T009 (different integration tests)
- T019, T025 (different components, no shared state)
- T027, T028 (optimization and docs independent)

## Parallel Execution Examples

```bash
# After T001-T002, launch all E2E tests together:
npm run test -- tests/e2e/phase-auto-advance.spec.ts &
npm run test -- tests/e2e/phase7-scrolling.spec.ts &
npm run test -- tests/e2e/document-sync.spec.ts &
npm run test -- tests/e2e/reports-functionality.spec.ts

# Launch integration tests together:
npm run test -- tests/integration/tabulation-tracker.spec.ts &
npm run test -- tests/integration/dsm-ui-sections.spec.ts &
npm run test -- tests/integration/attendee-export.spec.ts

# Create independent components in parallel:
# Task T019: TabulationTracker component
# Task T025: Export utility (different files)
```

## Notes

### Critical TDD Rules

- ⚠️ ALL tests (T003-T009) MUST be written and MUST FAIL before any implementation
- ⚠️ Tests should fail for the RIGHT reason (feature missing, not syntax error)
- ⚠️ Commit failing tests before starting implementation tasks

### Bug Fix Strategy

- Start each bug fix by reproducing locally (T001)
- Write E2E test that fails (T003-T006)
- Implement minimum fix to make test pass
- Verify no regressions with existing tests

### UI Enhancement Strategy

- Write integration tests for new features first (T007-T009)
- Build components incrementally (T021-T023)
- Integrate into pages last (T024)
- Test across browsers and devices

### Performance Considerations

- Use React.memo for DSM components (potentially 1000+ attendees)
- Implement virtual scrolling for large lists (T027)
- Web Workers for report generation (if needed in T018)
- Optimize re-renders with useMemo for expensive calculations

## Validation Checklist

_GATE: Checked before starting implementation_

- [x] All bugs have corresponding E2E tests (T003-T006)
- [x] All features have integration tests (T007-T009)
- [x] All tests come before implementation (Phase 3.2 → 3.3)
- [x] Parallel tasks are truly independent
- [x] Each task specifies exact file path
- [x] No [P] tasks modify the same file
- [x] Backend changes confirmed unnecessary (APIs exist)
- [x] Dependencies clearly documented

## Architecture Reference

```
Frontend (issuer-portal/)
├── Uses generated-schema.ts from OpenAPI ✅
├── Calls existing APIs in openapi.yaml ✅
├── No duplicate domain models ✅
└── Components organized by feature ✅

Backend (mock-api-server/)
├── No changes required ✅
├── APIs already implemented ✅
├── Domain models exist ✅
└── Database schema complete ✅
```

## Task Summary

- **Total Tasks**: 28
- **Investigation**: 2 tasks
- **E2E Tests**: 4 tasks
- **Integration Tests**: 3 tasks
- **Bug Fixes**: 9 tasks
- **New Features**: 8 tasks
- **Polish**: 2 tasks

**Estimated Timeline**: 7-10 days

- Investigation & Tests: 2-3 days
- Bug Fixes: 3-4 days
- New Features: 2-3 days
- Polish: 1 day
