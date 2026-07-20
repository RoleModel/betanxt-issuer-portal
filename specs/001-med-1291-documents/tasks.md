# Tasks: Shareholder Proxy Document Management

NOTE (Divergence Update - Direct Supabase Integration Implemented): We implemented an initial thin data-access layer directly against the existing Supabase tables (table `document`) ahead of the originally planned OpenAPI-first workflow. The following unplanned but completed adjustments occurred:

Completed Outside Original Plan:

- Replaced mock document utilities with real Supabase queries (`fetchDSMDocuments`, `fetchRegularDocuments`, `updateDocumentStatus`).
- Centralized document status enum to API-only uppercase set; removed legacy lowercase statuses; added friendly label mapping and dynamic action button logic.
- Added history JSON parsing (row.history -> typed `DocumentHistoryEntry[]`).
- Removed duplicate Supabase client file to avoid divergence; using shared client from mock-api-server.

Implications:

- OpenAPI client scaffolding (Phase 3.0) is now optional for the MVP UI already reading from Supabase. We can (A) proceed to retrofit an OpenAPI layer for future portability and contract tests, or (B) defer spec-driven client until after core UI flows stabilize. Recommendation: proceed with spec alignment but mark tasks as “adopt to replace direct calls” rather than strict blockers.
- Some repository/service abstractions defined in later phases may be simplified because a direct table-first approach is active. We can introduce repositories incrementally, wrapping the current utility functions, then swap their internals to use generated OpenAPI client.

Adjustments to Plan:

- Add T000 to capture divergence & retrofit tasks (DONE).
- Add new task T067A to wrap current direct Supabase functions behind a repository interface before introducing OpenAPI client (ensures single integration point).
- Renumbering kept stable to avoid breaking references; new tasks appended.

Status Legend Addendum:

- (DONE\*) indicates task accomplished via divergence prior to this revision.

**Input**: `/specs/001-med-1291-documents/` + `mock-api-server/openapi-schema/openapi.yaml` + `supabase/seed.ts` **Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md, openapi spec

## Format

`[ID] [P?] Description`

- [P] = may run in parallel (different files, no dependency)
- TDD enforced: tests (contract + integration + seed validation) fail before implementation

## Phase 3.0: OpenAPI Spec Alignment & Client Scaffolding

- [x] T000 (DONE\*) Record divergence & update tasks (this section) – provides migration path from direct Supabase access to OpenAPI client.

- [ ] T001 Audit current OpenAPI spec for missing document endpoints; add (sign-digital, upload-executed, upload, approve, replace, readiness, history) to `mock-api-server/openapi-schema/openapi.yaml`
- [ ] T002 Add script `scripts/generate-openapi-types.ts` using `openapi-typescript` to produce `issuer-portal/domain-models/api/generated.ts`
- [ ] T003 Add dependency `openapi-fetch` (and `openapi-typescript` as dev) in `issuer-portal/package.json`
- [ ] T004 [P] Implement typed API client wrapper `issuer-portal/domain-models/api/client.ts` (createOpenAPIClient) exporting typed fetchers
- [ ] T005 [P] Add runtime response validator (narrow assertions) in `issuer-portal/domain-models/api/responseGuard.ts`
- [ ] T006 Add drift check script `scripts/check-openapi-drift.sh` (compares contracts vs spec paths) & CI docs note

## Phase 3.1: Environment, Buckets & Seed Enhancements

- [ ] T007 Ensure Supabase local env & extend `.env.local` with `DOCS_BUCKET=documents` (deprecated: PROXY_BUCKET, SUPPORT_BUCKET removed after consolidation)
- [ ] T008 Create single storage bucket `documents` (replaces forms/proxy/supporting) & update `supabase/seed.sql` or docs with note on manual creation
- [ ] T009 Add DB migrations (tables/enums) in single file under `supabase/migrations/` (unify prior form/proxy/supporting structures if still planned, or mark deprecated) (form_documents, proxy_materials, supporting_documents, document_versions, approval_records, readiness_summaries + enums)
- [ ] T010 [P] Add enum TS declarations mapping DB enums in `issuer-portal/types/documents.ts`
- [ ] T011 [P] Stub digital signature provider + interface in `issuer-portal/domain-models/documents/signature/StubSignatureProvider.ts`
- [ ] T012 [P] Hash utility (SHA-256 Base64) in `issuer-portal/domain-models/documents/utils/hash.ts`
- [ ] T013 [P] File validation helper in `issuer-portal/domain-models/documents/utils/fileValidation.ts`
- [ ] T014 Enhance `supabase/seed.ts` to seed: meeting with 3 form_documents (FORM_GENERATED), one proxy placeholder, readiness_summaries row (all false), and sample supporting doc placeholders
- [ ] T015 Add seed verification script `scripts/verify-seed-documents.ts` (checks seeded counts, states) failing if mismatch

## Phase 3.2: Contract & Spec Convergence Tests (Failing First)

- [ ] T016 [P] Contract test forms digital sign (imports generated types) `issuer-portal/tests/contracts/documents/forms_sign_digital.test.ts`
- [ ] T017 [P] Contract test executed form upload `issuer-portal/tests/contracts/documents/forms_upload_executed.test.ts`
- [ ] T018 [P] Contract test proxy upload `issuer-portal/tests/contracts/documents/proxy_upload.test.ts`
- [ ] T019 [P] Contract test approve proxy version `issuer-portal/tests/contracts/documents/proxy_approve.test.ts`
- [ ] T020 [P] Contract test replace proxy version `issuer-portal/tests/contracts/documents/proxy_replace.test.ts`
- [ ] T021 [P] Contract test readiness `issuer-portal/tests/contracts/documents/readiness_get.test.ts`
- [ ] T022 [P] Contract test history listing `issuer-portal/tests/contracts/documents/history_get.test.ts`
- [ ] T023 Add spec drift test `issuer-portal/tests/contracts/openapi_documents_conformance.test.ts` (assert every documents path in contracts exists in generated types)

## Phase 3.3: Integration Tests (Failing First)

- [ ] T024 [P] Integration digital sign flow + readiness update `issuer-portal/tests/integration/documents/forms_digital_sign_flow.test.ts`
- [ ] T025 [P] Integration executed form upload flow `issuer-portal/tests/integration/documents/forms_upload_executed_flow.test.ts`
- [ ] T026 [P] Integration proxy approve flow `issuer-portal/tests/integration/documents/proxy_approve_flow.test.ts`
- [ ] T027 [P] Integration supporting optional upload `issuer-portal/tests/integration/documents/supporting_upload_flow.test.ts`
- [ ] T028 [P] Integration readiness partial vs complete `issuer-portal/tests/integration/documents/readiness_states.test.ts`
- [ ] T029 [P] Integration proxy replace flow `issuer-portal/tests/integration/documents/proxy_replace_flow.test.ts`
- [ ] T030 [P] Integration history listing immutability `issuer-portal/tests/integration/documents/history_listing.test.ts`
- [ ] T031 Seed verification test (exec seed then assert readiness false) `issuer-portal/tests/integration/documents/seed_state.test.ts`

## Phase 3.4: Models & Data Access

- [ ] T032 [P] Enum mappers & shared types `issuer-portal/domain-models/documents/types.ts`
- [ ] T033 [P] FormDocument repository `issuer-portal/domain-models/documents/repositories/FormDocumentsRepo.ts`
- [ ] T034 [P] ProxyMaterial repository `issuer-portal/domain-models/documents/repositories/ProxyMaterialsRepo.ts`
- [ ] T035 [P] SupportingDocument repository `issuer-portal/domain-models/documents/repositories/SupportingDocumentsRepo.ts`
- [ ] T036 [P] DocumentVersions repository `issuer-portal/domain-models/documents/repositories/DocumentVersionsRepo.ts`
- [ ] T037 [P] ApprovalRecords repository `issuer-portal/domain-models/documents/repositories/ApprovalRecordsRepo.ts`
- [ ] T038 [P] ReadinessSummary repository `issuer-portal/domain-models/documents/repositories/ReadinessRepo.ts`

## Phase 3.5: Services & Domain Logic

- [ ] T039 Form digital sign service `issuer-portal/domain-models/documents/services/FormSigningService.ts`
- [ ] T040 Executed form upload service `issuer-portal/domain-models/documents/services/FormUploadService.ts`
- [ ] T041 Proxy upload service `issuer-portal/domain-models/documents/services/ProxyUploadService.ts`
- [ ] T042 Proxy approve service `issuer-portal/domain-models/documents/services/ProxyApproveService.ts`
- [ ] T043 Proxy replace service `issuer-portal/domain-models/documents/services/ProxyReplaceService.ts`
- [ ] T044 Supporting upload service `issuer-portal/domain-models/documents/services/SupportingUploadService.ts`
- [ ] T045 Readiness compute service `issuer-portal/domain-models/documents/services/ReadinessService.ts`
- [ ] T046 Event dispatcher & typed events `issuer-portal/domain-models/documents/events/DocumentEvents.ts`
- [ ] T047 Hash & validation integration adjustments across services

## Phase 3.6: API Route Implementations

(Implement only after failing tests exist)

- [ ] T048 Forms digital sign route `issuer-portal/app/api/documents/forms/[formType]/sign-digital/route.ts`
- [ ] T049 Forms upload executed route `issuer-portal/app/api/documents/forms/[formType]/upload-executed/route.ts`
- [ ] T050 Generic document upload route `issuer-portal/app/api/documents/[documentType]/upload/route.ts`
- [ ] T051 Approve route `issuer-portal/app/api/documents/[documentType]/[versionId]/approve/route.ts`
- [ ] T052 Replace route `issuer-portal/app/api/documents/[documentType]/[approvedVersionId]/replace/route.ts`
- [ ] T053 Readiness route `issuer-portal/app/api/documents/readiness/route.ts`
- [ ] T054 History route `issuer-portal/app/api/documents/[documentType]/history/route.ts`
- [ ] T055 API client integration test (using openapi-fetch client) `issuer-portal/tests/integration/documents/api_client_roundtrip.test.ts`

## Phase 3.7: Observability & Integrity

- [ ] T056 Structured event logging `issuer-portal/domain-models/documents/events/emit.ts`
- [ ] T057 Populate audit metadata (actor, meetingId) in services
- [ ] T058 Hash verification on retrieval (optional fast path)
- [ ] T059 Error mapping utility `issuer-portal/domain-models/documents/utils/errors.ts`
- [ ] T060 Add OpenAPI examples for document endpoints (request/response) in `mock-api-server/openapi-schema/openapi.yaml`

## Phase 3.8: Seed & Performance Polish

- [ ] T061 [P] Unit tests hash & validation utils `issuer-portal/tests/unit/documents/utils.test.ts`
- [ ] T062 [P] Unit tests readiness edge cases `issuer-portal/tests/unit/documents/readiness_service.test.ts`
- [ ] T063 Performance smoke (readiness <150ms, approve <300ms) `issuer-portal/tests/perf/documents/perf_smoke.test.ts`
- [ ] T064 [P] Documentation sync quickstart updates `specs/001-med-1291-documents/quickstart.md`
- [ ] T065 Dead code & duplication cleanup
- [ ] T066 Security review checklist `specs/001-med-1291-documents/security-review.md`
- [ ] T067 Final readiness recompute & manual walkthrough (no code)

### New / Divergence Retrofit Tasks

- [ ] T067A Abstract current direct Supabase document utilities into `issuer-portal/domain-models/documents/repositories/DocumentRepo.ts` (wrap `fetchDSMDocuments`, `fetchRegularDocuments`, `updateDocumentStatus`) so future OpenAPI client swap is localized.
- [ ] T067B Add unit test stubs for history parsing (given JSON variations: null, empty array, mixed objects) `issuer-portal/tests/unit/documents/history_parsing.test.ts`.
- [ ] T067C Add follow-up doc section in quickstart describing interim direct-access layer and migration path to OpenAPI (`specs/001-med-1291-documents/quickstart.md`).

Retrofit Coverage Mapping:

- Direct Supabase read/write (DONE\*) corresponds to future T032–T038 repository goals.
- History parsing (DONE\*) partially satisfies future history listing endpoint (T054/T022/T030) once API route added.
- Status normalization & action logic (DONE\*) supports UI readiness for service layer integration.

## Dependencies Summary

- Phase 3.0 (T001–T006) precedes any test using generated types
- Seed & migrations (T007–T015) before integration tests (T024+); contract tests can run with mocked persistence if needed
- Contract tests (T016–T023) & integration tests (T024–T031) must fail before model/services/routes (T032+)
- Repositories (T032–T038) before services (T039–T047)
- Services before routes (T048–T054) & before API client roundtrip (T055)
- Observability (T056–T060) after core logic but before perf & final polish
- Seed verification (T031) ensures test baseline

## Parallel Execution Examples

Early batch candidates:

- T002, T003, T004, T005 (independent client scaffolding)
- T010–T013 (utilities + enums)
- T016–T023 (all contract tests)
- T024–T031 (integration tests) once seed & migrations complete

## Validation Checklist

- [ ] All document endpoints present in OpenAPI spec (T001) & examples added (T060)
- [ ] Generated types consumed by contract tests (T016–T023)
- [ ] Drift script exists (T006) and drift test added (T023)
- [ ] Seed extended with document baseline (T014) & verified (T015, T031)
- [ ] Repos/services/routes cover full lifecycle
- [ ] Observability + error mapping implemented
- [ ] Security & performance addressed (T063, T066)

Status: READY FOR EXECUTION (Revised with Divergence Notes)
