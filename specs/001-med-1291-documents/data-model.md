# Data Model: Shareholder Proxy Document Management

Date: 2025-09-21

## Modeling Principles

- Immutable executed & approved versions (append-only versions table)
- Explicit state machines; no implicit boolean proliferation
- Separation of document logical identity vs version instance
- All timestamps stored in UTC ISO8601
- Hash every stored binary (SHA-256) for integrity

## Entity Overview Diagram (Logical)

```
Meeting (id) 1---* FormDocument (id, meetingId, type)
Meeting (id) 1---* ProxyMaterial (id, meetingId, type)
Meeting (id) 1---* SupportingDocument (id, meetingId, type, isRequired)
FormDocument 1---* DocumentVersion (id, parentType=form, parentId)
ProxyMaterial 1---* DocumentVersion (id, parentType=proxy, parentId)
SupportingDocument 1---* DocumentVersion (id, parentType=supporting, parentId)
DocumentVersion 1---0..1 ApprovalRecord (id, versionId)
Meeting 1---1 ReadinessSummary (meetingId)
```

## Enumerations

```
FormType: { FORM_OF_PROXY, VIF, CONTROLLED_ACCOUNT_REPORT }
ProxyMaterialType: { PROXY_STATEMENT, ANNUAL_REPORT, NOTICE_OF_MEETING }
SupportingDocumentType: { PRESS_RELEASE, ESG_REPORT, COMPENSATION_DISCLOSURE, OTHER }
DocumentKind (parent discriminator): { FORM, PROXY, SUPPORTING }
FormState: { FORM_GENERATED, EXECUTED }
ProxyMaterialState: { NOT_UPLOADED, PLACEHOLDER, UPLOADED, GENERATED, PENDING_REVIEW, APPROVED }
SupportingState: { PLACEHOLDER, STORED }
ApprovalStatus: { PENDING, APPROVED }
ReadinessStatus: { NOT_READY, PARTIAL, READY }
```

## Tables (Proposed)

### meetings

| Field        | Type        | Notes         |
| ------------ | ----------- | ------------- |
| id           | uuid        | PK            |
| ticker       | text        | Indexed       |
| meeting_date | timestamptz |               |
| created_at   | timestamptz | default now() |

### form_documents

| Field                | Type        | Notes                                            |
| -------------------- | ----------- | ------------------------------------------------ |
| id                   | uuid        | PK                                               |
| meeting_id           | uuid        | FK meetings(id)                                  |
| type                 | FormType    | unique(meeting_id,type)                          |
| state                | FormState   |                                                  |
| generated_version_id | uuid        | FK document_versions(id)                         |
| executed_version_id  | uuid        | FK document_versions(id) nullable until executed |
| created_at           | timestamptz |                                                  |
| updated_at           | timestamptz |                                                  |

### proxy_materials

| Field               | Type               | Notes                                          |
| ------------------- | ------------------ | ---------------------------------------------- |
| id                  | uuid               | PK                                             |
| meeting_id          | uuid               | FK meetings(id)                                |
| type                | ProxyMaterialType  | unique(meeting_id,type)                        |
| state               | ProxyMaterialState |                                                |
| latest_version_id   | uuid               | FK document_versions(id) nullable until upload |
| approved_version_id | uuid               | FK document_versions(id) nullable              |
| created_at          | timestamptz        |                                                |
| updated_at          | timestamptz        |                                                |

### supporting_documents

| Field             | Type                   | Notes                                          |
| ----------------- | ---------------------- | ---------------------------------------------- |
| id                | uuid                   | PK                                             |
| meeting_id        | uuid                   | FK meetings(id)                                |
| type              | SupportingDocumentType | unique(meeting_id,type)                        |
| is_required       | boolean                | default false                                  |
| state             | SupportingState        |                                                |
| latest_version_id | uuid                   | FK document_versions(id) nullable until upload |
| created_at        | timestamptz            |                                                |
| updated_at        | timestamptz            |                                                |

### document_versions

| Field          | Type         | Notes                                                                  |
| -------------- | ------------ | ---------------------------------------------------------------------- |
| id             | uuid         | PK                                                                     |
| parent_kind    | DocumentKind | {FORM,PROXY,SUPPORTING}                                                |
| parent_id      | uuid         | FK to appropriate parent                                               |
| version_number | integer      | Starts at 1 per parent                                                 |
| filename       | text         | original client filename                                               |
| mime_type      | text         | validated                                                              |
| byte_size      | integer      | limit enforced per type                                                |
| storage_path   | text         | Supabase storage key                                                   |
| hash_sha256    | text         | Base64 digest                                                          |
| status         | text         | For FORMs echo parent state; for PROXY derived; for SUPPORTING derived |
| created_by     | uuid         | user id                                                                |
| created_at     | timestamptz  |                                                                        |

### approval_records

| Field       | Type        | Notes                           |
| ----------- | ----------- | ------------------------------- |
| id          | uuid        | PK                              |
| version_id  | uuid        | FK document_versions(id) unique |
| approved_by | uuid        | user id                         |
| approved_at | timestamptz |                                 |
| comment     | text        | optional rationale              |

### readiness_summaries

| Field              | Type        | Notes                                     |
| ------------------ | ----------- | ----------------------------------------- |
| meeting_id         | uuid        | PK + FK meetings(id)                      |
| phase1_ready       | boolean     | computed                                  |
| phase2_ready       | boolean     | computed                                  |
| overall_ready      | boolean     | computed                                  |
| outstanding_phase1 | jsonb       | array of missing/invalid forms            |
| outstanding_phase2 | jsonb       | array of missing/invalid proxy/supporting |
| computed_at        | timestamptz | last recompute                            |

## State Machines

### FormDocument

```
FORM_GENERATED --(upload executed OR digital sign)--> EXECUTED
EXECUTED: terminal
```

Validation: executed_version_id must reference a version whose hash is stored & immutable flag true.

### ProxyMaterial

```
NOT_UPLOADED or PLACEHOLDER --(upload/generate)--> UPLOADED or GENERATED
UPLOADED/GENERATED --(submit for review)--> PENDING_REVIEW
PENDING_REVIEW --(approve)--> APPROVED
APPROVED --(replace by ADMIN)--> UPLOADED (new version, previous APPROVED retained)
```

Guards: Cannot approve unless latest_version_id matches candidate version.

### SupportingDocument

```
PLACEHOLDER --(upload)--> STORED
STORED --(re-upload)--> STORED (new version_number increment)
```

## Readiness Rules

- Phase1 ready if every form state = EXECUTED
- Phase2 ready if every required proxy material state = APPROVED AND all required supporting documents state = STORED
- Overall ready = phase1_ready AND phase2_ready
- Outstanding arrays list (entityType, identifier, missingState)

## Integrity & Constraints

- Enforce unique (parent_id, version_number)
- Enforce immutable version rows (no update except derived status if needed; prefer no update semantics and derive from parent)
- Use database trigger or application guard to prevent executed form replacement

## Derived Views (Future)

- material_current_versions (join parent + latest) for listing
- readiness_overview (denormalized for dashboard)

## Index Strategy

- document_versions(parent_id, version_number DESC)
- form_documents(meeting_id)
- proxy_materials(meeting_id)
- supporting_documents(meeting_id)
- approval_records(version_id)

## Open Modeling Questions (None Blocking)

- Multi-language document variants? (Out of scope Phase 1/2)
- External CDN pre-signed URL expiration policy length

Status: READY for contract specification.
