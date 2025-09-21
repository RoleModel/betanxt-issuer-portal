# Feature Specification: Shareholder Proxy Document Management (Phase 1 & Phase 2 Document Workflows)

**Feature Branch**: `001-med-1291-documents`  
**Created**: 2025-09-21  
**Status**: Draft  
**Input**: User description (superseded by phased re-scope):
"Phase 1 Documents

Transfer Agent Registered File Request Form (generated PDF, Digitally signed or Download wet signature and reupload)

Plan File Request form (generated PDF, Digitally signed or Download wet signature and reupload)

Sign Broadridge Corporate Issuer Profile Form (generated PDF) Digitally signed

Phase 2

Draft Proxy Statement - (Issuer Uploads)

Proxy Card (Issuer Uploads)

Notice and Access Form (View and Approve)

Voting Instruction Form

Agenda (Issuer Uploads) on Agenda Tab then displays on Agenda Tab)

Digital Shareholder Documents (placeholders on documents tab for uploading)

- Static Slides.ppt
- 2025 Virtual Annual Meeting Rules of Conduct.pdf
- Forward Looking Statements.pdf
- DSMGuest.xlsx"

This specification replaces prior generalized scope with a phased delivery focus on concrete document types and workflows.

## Execution Flow (main)

```
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors, actions, data, constraints
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines

- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements

- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation

When creating this spec from a user prompt:

1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## User Scenarios & Testing _(mandatory)_

### Primary User Story

For an upcoming shareholder meeting, issuer operations staff must assemble a required package of regulatory and shareholder communications documents. In Phase 1 they interact with three system-generated PDF forms that require either embedded digital signature completion or a workflow to download, wet-sign offline, and re-upload the executed form. In Phase 2 they expand to include issuer-provided proxy materials, agenda content, and supporting digital shareholder documents uploaded into managed placeholders. The system guides users through completion status, approvals, and readiness for downstream processing and distribution.

Phasing focuses early delivery on high-certainty, form-driven compliance artifacts (Phase 1) and then broadens to richer issuer-authored content and meeting collateral (Phase 2).

### Acceptance Scenarios

Phase 1 – Generated Forms with Signature Options

1. **Given** a meeting has been created, **When** the system auto-generates the Transfer Agent Registered File Request Form, **Then** it appears in FORM GENERATED state with actions: Sign Digitally, Download for Wet Signature.
2. **Given** a generated form in FORM GENERATED state, **When** the user selects Sign Digitally and completes all required signature fields, **Then** the document transitions to EXECUTED and is locked (no further edits, only version supersession if allowed).
3. **Given** a generated form in FORM GENERATED state, **When** the user downloads it, obtains a wet signature offline, and uploads the signed PDF, **Then** the system validates file type and transitions the form to EXECUTED (storing the uploaded file as authoritative version 1).
4. **Given** a generated form already EXECUTED, **When** a user attempts to re-initiate digital signing, **Then** the system blocks the action with a message the form is finalized.
5. **Given** all three Phase 1 forms are EXECUTED, **When** the user views Phase 1 readiness status, **Then** the system reports PHASE 1 COMPLETE.

Phase 2 – Issuer Uploaded Core Proxy Materials 6. **Given** Phase 2 has begun and the issuer has not yet uploaded a Draft Proxy Statement, **When** the user uploads a file under that placeholder, **Then** the system stores it as version 1 in PENDING REVIEW state. 7. **Given** a Draft Proxy Statement in PENDING REVIEW, **When** an approver reviews and approves it, **Then** it transitions to APPROVED and is included in readiness calculations. 8. **Given** an APPROVED Draft Proxy Statement, **When** the issuer uploads a replacement, **Then** a new version is created in DRAFT (or PENDING REVIEW) while the prior approved version remains active until approval of the new version. 9. **Given** a Notice and Access Form placeholder, **When** the system renders a view-only generated version and the user approves it, **Then** its status becomes APPROVED with no upload required. 10. **Given** an Agenda file uploaded through the Agenda Tab, **When** it is saved successfully, **Then** it also appears as the current Agenda document in Documents Tab with synchronized status.

Digital Shareholder Supporting Documents 11. **Given** supporting document placeholders (Slides, Rules of Conduct, Forward Looking Statements, Guest List) exist, **When** each file is uploaded, **Then** its status shifts from PLACEHOLDER to STORED. 12. **Given** a supporting document in STORED status, **When** a user replaces it, **Then** a new version is created and prior version retained for audit (if policy allows) pending approval if an approval step is required— [NEEDS CLARIFICATION: Is approval required for supporting documents?].

Cross-Phase Readiness 13. **Given** Phase 1 COMPLETE and all required Phase 2 core documents APPROVED, **When** readiness is requested, **Then** system marks OVERALL PACKAGE READY (assuming any required supporting documents present) — [NEEDS CLARIFICATION: Are supporting documents mandatory for readiness?].

### Edge Cases

- User tries to digitally sign after having uploaded a wet-signed version → system prevents duplicate execution path.
- Uploaded wet-signed form missing required signature pages → system flags validation error (if detectable) — [NEEDS CLARIFICATION: Automated signature presence check?].
- Proxy Card uploaded with wrong document type selected → system rejects or requires correction prior to status change.
- Agenda updated after related documents approved → readiness recalculates if Agenda is considered required — [NEEDS CLARIFICATION: Agenda requirement for readiness?].
- Supporting document replaced while readiness already achieved → readiness remains unless document is required and missing.
- Multiple users attempt to upload a Draft Proxy Statement simultaneously → only first accepted; others receive conflict.
- Digital signature session abandoned mid-process → form remains FORM GENERATED awaiting completion.
- User attempts to delete an EXECUTED Phase 1 form → prohibited; must create a superseding correction process — [NEEDS CLARIFICATION: Correction path?].

_[NEEDS CLARIFICATION: Approval roles per document category (e.g., legal vs operations)? ]_
_[NEEDS CLARIFICATION: Are supporting documents optional or required for readiness? ]_
_[NEEDS CLARIFICATION: Digital signature provider constraints / limits? ]_
_[NEEDS CLARIFICATION: Maximum file size & formats per document category? ]_
_[NEEDS CLARIFICATION: Version correction / amendment workflow for executed Phase 1 forms? ]_
_[NEEDS CLARIFICATION: Automatic watermarking of Draft versions? ]_
_[NEEDS CLARIFICATION: Do supporting docs require approval or just presence? ]_
_[NEEDS CLARIFICATION: Agenda synchronization latency or version linkage? ]_
_[NEEDS CLARIFICATION: Required retention / archival strategy for superseded or rejected versions? ]_
_[NEEDS CLARIFICATION: Digital signature validation evidence (hash, certificate) storage scope? ]_

## Requirements _(mandatory)_

### Functional Requirements

Phase 1 Core Generated Forms

- **FR-001**: System MUST auto-generate three Phase 1 PDF forms per meeting: Transfer Agent Registered File Request, Plan File Request, Broadridge Corporate Issuer Profile.
- **FR-002**: System MUST display each generated form in FORM GENERATED status with available actions: Digital Sign, Download for Wet Signature.
- **FR-003**: System MUST allow a user to complete a Digital Sign workflow that transitions a form to EXECUTED and locks further edits.
- **FR-004**: System MUST allow upload of a wet-signed PDF for a form; upon successful validation status becomes EXECUTED.
- **FR-005**: System MUST enforce that only one execution path (digital or wet-upload) may finalize a form; the alternative path is disabled once EXECUTED.
- **FR-006**: System MUST transition to Phase 2 completion indicator only when all three forms are EXECUTED.
- **FR-007**: System MUST capture execution evidence metadata (method: digital|wet, execution timestamp, executor user id, hash/fingerprint) — [NEEDS CLARIFICATION: hash spec].

Phase 2 Core Proxy Materials

- **FR-012**: System MUST provide a view-and-approve workflow for Notice and Access Form (no upload required if generated) transitioning from GENERATED to APPROVED.
- **FR-013**: System MUST track statuses: NOT_UPLOADED → (UPLOADED | GENERATED) → PENDING REVIEW → APPROVED.
- **FR-014**: System MUST allow version replacement for APPROVED Phase 2 documents creating a new version in PENDING REVIEW while previous approved version remains active until approval decision.
- **FR-015**: System MUST prevent deletion of APPROVED versions; only supersession via new version is allowed.

Supporting Digital Shareholder Documents

- **FR-020**: System MUST show upload slots (placeholders) for: Static Slides.ppt, Rules of Conduct.pdf, Forward Looking Statements.pdf, DSMGuest.xlsx.
- **FR-021**: System MUST transition a supporting document placeholder to STORED upon successful upload.
- **FR-022**: System MUST permit re-upload (creating a new version) of supporting documents while retaining prior version references — [NEEDS CLARIFICATION: retention policy].
- **FR-023**: System MUST optionally mark supporting documents as OPTIONAL or REQUIRED — [NEEDS CLARIFICATION: which are required].

Cross-Cutting & Readiness

- **FR-030**: System MUST compute Phase 1 readiness based on all Phase 1 forms EXECUTED.
- **FR-031**: System MUST compute Phase 2 readiness based on APPROVED statuses of required core proxy materials.
- **FR-032**: System MUST compute overall package readiness when Phase 1 readiness + Phase 2 readiness + required supporting documents present.
- **FR-033**: System MUST provide a consolidated readiness dashboard listing unmet items.
- **FR-034**: System MUST log all status transitions with actor, timestamp, from-state, to-state, and reason/comment if provided.
- **FR-035**: System MUST allow exporting a readiness / execution report.

Validation & Compliance

- **FR-040**: System MUST validate file types per placeholder (e.g., PPT for Slides, PDF for forms, XLS/XLSX for DSMGuest) — [NEEDS CLARIFICATION: allowed variants].
- **FR-041**: System MUST reject oversized files with clear message — [NEEDS CLARIFICATION: size limits].
- **FR-042**: System MUST store and display version numbers sequentially per document (starting at 1 for first execution or upload).
- **FR-043**: System MUST block readiness marking if any required placeholder remains in PLACEHOLDER or PENDING REVIEW state.
- **FR-044**: System MUST record whether a Phase 1 form was executed digitally or via wet upload for audit filtering.
- **FR-045**: System MUST surface warnings if deadlines approach with remaining unexecuted / unapproved documents — [NEEDS CLARIFICATION: deadline source].

Security & Access (Conceptual)

- **FR-050**: System MUST restrict digital signing actions to authorized issuer roles — [NEEDS CLARIFICATION: role list].
- **FR-051**: System MUST restrict approval actions for Phase 2 documents to designated approvers distinct from uploaders — [NEEDS CLARIFICATION: separation of duties rule?].
- **FR-052**: System MUST audit unsuccessful attempts to perform restricted actions.

Ambiguity markers retained for clarification.

_Ambiguities captured inline using [NEEDS CLARIFICATION] markers._

### Key Entities _(include if feature involves data)_

- **Meeting**: Anchor entity for grouping all Phase 1 and Phase 2 documents.
- **Form (Phase 1)**: Generated document requiring execution (digital or wet). Attributes: form type, status (FORM GENERATED | EXECUTED), execution method, execution timestamp, version (always 1 unless correction path added), evidence metadata.
- **Proxy Material (Phase 2 Core)**: Document placeholder with statuses ( UPLOADED | PENDING REVIEW | APPROVED). Includes version history.
- **Supporting Document**: Ancillary meeting collateral (Slides, Rules, Statements, Guest list) with status (PLACEHOLDER | STORED) and versions if re-uploaded.
- **Document Version**: Versioned instance with number, file reference, created timestamp, status.
- **Approval Record**: Audit record of approval/review actions for proxy materials.
- **Readiness Summary**: Derived aggregation indicating Phase 1, Phase 2, and Overall readiness states plus outstanding items list.
- **User / Role**: Actor with capabilities (uploader, approver, signer) — [NEEDS CLARIFICATION: role matrix].
- **Placeholder Definition**: Configuration describing required vs optional nature, allowed file types, and phase association — [NEEDS CLARIFICATION: authoritative source].

Relationships: Meeting 1—_ Form; Meeting 1—_ Proxy Material; Meeting 1—_ Supporting Document; Each Proxy Material/Form/Supporting Document 1—_ Document Version; Document Version 1—\* Approval Record (where applicable). Readiness Summary derived per Meeting.

---

## Review & Acceptance Checklist

_GATE: Automated checks run during main() execution_

### Content Quality

- [ ] No implementation details (languages, frameworks, APIs)
- [ ] Focused on user value and business needs
- [ ] Written for non-technical stakeholders
- [ ] All mandatory sections completed

### Requirement Completeness

- [ ] No [NEEDS CLARIFICATION] markers remain
- [ ] Requirements are testable and unambiguous
- [ ] Success criteria are measurable
- [ ] Scope is clearly bounded
- [ ] Dependencies and assumptions identified

---

## Execution Status

_Updated by main() during processing_

- [ ] User description parsed
- [ ] Key concepts extracted
- [ ] Ambiguities marked
- [ ] User scenarios defined
- [ ] Requirements generated
- [ ] Entities identified
- [ ] Review checklist passed

---
