# Tasks: Shareholder Proxy Document Management

**Input**: Design documents from `/specs/001-med-1291-documents/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
(Reference only – already executed by /tasks workflow)

## Format
`[ID] [P?] Description`
- [P] can run in parallel (different files, no dependency overlap)
- TDD: All contract & integration tests precede implementation tasks they validate

## Phase 3.1: Setup & Schema

- [ ] T001 Ensure Supabase local running & env vars extended (`issuer-portal/.env.local`) with document bucket names (e.g. `DOCS_BUCKET=forms`, `PROXY_BUCKET=proxy`, `SUPPORT_BUCKET=supporting`) – no code file
- [ ] T002 Create storage buckets (manual or migration note) & document in `supabase/seed.sql`
- [ ] T003 Add database migrations for new tables/enums in `supabase/migrations/` (form_documents, proxy_materials, supporting_documents, document_versions, approval_records, readiness_summaries, enums) – one migration file
- [ ] T004 [P] Add enum TypeScript declarations mapping to DB enums in `issuer-portal/types/documents.ts`
- [ ] T005 [P] Add stub digital signature provider interface + stub implementation in `issuer-portal/domain-models/documents/signature/StubSignatureProvider.ts`
- [ ] T006 Add hashing utility (SHA-256 Base64) in `issuer-portal/domain-models/documents/utils/hash.ts`
- [ ] T007 Add file validation helper (mime/size per type) in `issuer-portal/domain-models/documents/utils/fileValidation.ts`

## Phase 3.2: Contract Tests (Failing First)
Contract files → one test each. Paths: `issuer-portal/tests/contracts/documents/`

- [ ] T008 [P] Contract test forms digital sign POST `/api/documents/forms/FORM_OF_PROXY/sign-digital` in `issuer-portal/tests/contracts/documents/forms_sign_digital.test.ts`
- [ ] T009 [P] Contract test forms upload executed POST `/api/documents/forms/VIF/upload-executed` in `issuer-portal/tests/contracts/documents/forms_upload_executed.test.ts`
- [ ] T010 [P] Contract test generic upload POST `/api/documents/PROXY_STATEMENT/upload` in `issuer-portal/tests/contracts/documents/proxy_upload.test.ts`
- [ ] T011 [P] Contract test approve POST `/api/documents/PROXY_STATEMENT/{versionId}/approve` in `issuer-portal/tests/contracts/documents/proxy_approve.test.ts`
- [ ] T012 [P] Contract test replace POST `/api/documents/PROXY_STATEMENT/{approvedVersionId}/replace` in `issuer-portal/tests/contracts/documents/proxy_replace.test.ts`
- [ ] T013 [P] Contract test readiness GET `/api/documents/readiness?meetingId=` in `issuer-portal/tests/contracts/documents/readiness_get.test.ts`
- [ ] T014 [P] Contract test history GET `/api/documents/PROXY_STATEMENT/history?meetingId=` in `issuer-portal/tests/contracts/documents/history_get.test.ts`

## Phase 3.3: Integration Tests (Failing First)
Scenarios from quickstart. Paths: `issuer-portal/tests/integration/documents/`

- [ ] T015 [P] Integration test end-to-end form digital sign + readiness update in `issuer-portal/tests/integration/documents/forms_digital_sign_flow.test.ts`
- [ ] T016 [P] Integration test executed form upload (wet-sign) in `issuer-portal/tests/integration/documents/forms_upload_executed_flow.test.ts`
- [ ] T017 [P] Integration test proxy material approve flow (upload → approve) in `issuer-portal/tests/integration/documents/proxy_approve_flow.test.ts`
- [ ] T018 [P] Integration test supporting document optional upload in `issuer-portal/tests/integration/documents/supporting_upload_flow.test.ts`
- [ ] T019 [P] Integration test readiness computation partial vs complete in `issuer-portal/tests/integration/documents/readiness_states.test.ts`
- [ ] T020 [P] Integration test replace approved proxy material in `issuer-portal/tests/integration/documents/proxy_replace_flow.test.ts`
- [ ] T021 [P] Integration test history listing ordering & immutability in `issuer-portal/tests/integration/documents/history_listing.test.ts`

## Phase 3.4: Models & Data Access

- [ ] T022 [P] Implement enum type mappers & shared types in `issuer-portal/domain-models/documents/types.ts`
- [ ] T023 [P] FormDocument repository functions (create initial, mark executed) in `issuer-portal/domain-models/documents/repositories/FormDocumentsRepo.ts`
- [ ] T024 [P] ProxyMaterial repository (create placeholder, add version, mark approved) in `issuer-portal/domain-models/documents/repositories/ProxyMaterialsRepo.ts`
- [ ] T025 [P] SupportingDocument repository (create placeholder, add version) in `issuer-portal/domain-models/documents/repositories/SupportingDocumentsRepo.ts`
- [ ] T026 [P] DocumentVersions repository (createVersion, listByParent, getHistory) in `issuer-portal/domain-models/documents/repositories/DocumentVersionsRepo.ts`
- [ ] T027 [P] ApprovalRecords repository in `issuer-portal/domain-models/documents/repositories/ApprovalRecordsRepo.ts`
- [ ] T028 [P] ReadinessSummary repository (compute + persist) in `issuer-portal/domain-models/documents/repositories/ReadinessRepo.ts`

## Phase 3.5: Services & Domain Logic

- [ ] T029 Orchestrate form digital sign service (generate version hash, create executed version, update FormDocument, emit event) in `issuer-portal/domain-models/documents/services/FormSigningService.ts`
- [ ] T030 Orchestrate executed form upload service in `issuer-portal/domain-models/documents/services/FormUploadService.ts`
- [ ] T031 Proxy upload service (validate type, create version, update parent state) in `issuer-portal/domain-models/documents/services/ProxyUploadService.ts`
- [ ] T032 Proxy approve service (guards, create ApprovalRecord, update parent & readiness) in `issuer-portal/domain-models/documents/services/ProxyApproveService.ts`
- [ ] T033 Proxy replace service (guards admin, create new version, leave approved version) in `issuer-portal/domain-models/documents/services/ProxyReplaceService.ts`
- [ ] T034 Supporting upload service in `issuer-portal/domain-models/documents/services/SupportingUploadService.ts`
- [ ] T035 Readiness compute service (aggregate states, write readiness_summaries) in `issuer-portal/domain-models/documents/services/ReadinessService.ts`
- [ ] T036 Event dispatcher & typed events definition in `issuer-portal/domain-models/documents/events/DocumentEvents.ts`
- [ ] T037 Hash & validation integration (use utils in services) update tests

## Phase 3.6: API Route Implementations
(Implement only after corresponding tests exist failing)

- [ ] T038 Implement forms digital sign route in `issuer-portal/app/api/documents/forms/[formType]/sign-digital/route.ts`
- [ ] T039 Implement forms upload executed route in `issuer-portal/app/api/documents/forms/[formType]/upload-executed/route.ts`
- [ ] T040 Implement generic document upload route in `issuer-portal/app/api/documents/[documentType]/upload/route.ts`
- [ ] T041 Implement approve route in `issuer-portal/app/api/documents/[documentType]/[versionId]/approve/route.ts`
- [ ] T042 Implement replace route in `issuer-portal/app/api/documents/[documentType]/[approvedVersionId]/replace/route.ts`
- [ ] T043 Implement readiness get route in `issuer-portal/app/api/documents/readiness/route.ts`
- [ ] T044 Implement history get route in `issuer-portal/app/api/documents/[documentType]/history/route.ts`

## Phase 3.7: Observability & Integrity

- [ ] T045 Structured event logging (form.generated, form.executed, document.uploaded, document.approved, readiness.computed) in `issuer-portal/domain-models/documents/events/emit.ts`
- [ ] T046 Add audit metadata fields population (actor, meetingId) where missing across services
- [ ] T047 Add hashing verification check on retrieval paths (optional fast path) in services
- [ ] T048 Add error mapping utility (domain errors → HTTP codes) in `issuer-portal/domain-models/documents/utils/errors.ts`

## Phase 3.8: Polish & Finalization

- [ ] T049 [P] Unit tests for hash & validation utilities in `issuer-portal/tests/unit/documents/utils.test.ts`
- [ ] T050 [P] Unit tests for readiness service edge cases (partial, missing required) in `issuer-portal/tests/unit/documents/readiness_service.test.ts`
- [ ] T051 Performance smoke (readiness <150ms, approve <300ms) script in `issuer-portal/tests/perf/documents/perf_smoke.test.ts`
- [ ] T052 [P] Documentation sync: update `specs/001-med-1291-documents/quickstart.md` with any route nuances discovered
- [ ] T053 Dead code & duplication pass (remove unused placeholders)
- [ ] T054 Security review checklist (file type enforcement, size limits, role restrictions) in `specs/001-med-1291-documents/security-review.md`
- [ ] T055 Final readiness recompute & manual quickstart walkthrough (checklist ticks) no code file

## Dependencies Summary

- Setup (T001–T007) before tests needing utilities (tests can stub if earlier) – minimal cross dependency
- Contract tests (T008–T014) and integration tests (T015–T021) must precede implementation tasks they cover
- Repositories (T023–T028) before services (T029–T035)
- Services before API routes (T038–T044)
- Events (T036) can occur alongside services but before routes use them
- Observability tasks (T045–T048) after core services but before polish tests verifying logging if any
- Polish (T049–T055) last

## Parallel Execution Guidance

Example early parallel batch:
- T004, T005, T006, T007 (independent utilities)
- T008–T014 (all contract tests together)
- T015–T021 (all integration tests together after contract tests if environment stable)

## Validation Checklist

- [ ] All contracts mapped → T008–T014 present
- [ ] All entities have repository/model tasks → T023–T028
- [ ] Quickstart scenarios fully covered → T015–T021
- [ ] TDD ordering preserved (tests before implementation)
- [ ] Parallel markers only on independent paths
- [ ] Hashing, file validation, readiness, approvals all have service coverage
- [ ] Observability events enumerated
- [ ] Security constraints tasks present (size/type, role)

Status: READY FOR EXECUTION
