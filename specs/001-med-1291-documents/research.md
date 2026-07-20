# Research & Decisions: Shareholder Proxy Document Management

Date: 2025-09-21  
Source Spec: `specs/001-med-1291-documents/spec.md`

## Format Legend

Decision blocks capture: Decision | Rationale | Alternatives | Risks / Mitigations | Follow-up Trigger Deferrals capture: Deferred Item | Reason for Deferral | Containment Strategy | Revisit Criteria | Owner (TBD)

---

## 1. Digital Signature Provider (Phase 1 Stub)

Decision: Use internal stub service producing deterministic signature artifact & metadata (JSON) persisted with executed form.  
Rationale: Avoid blocking Phase 1 while vendor evaluation completes.  
Alternatives: (a) DocuSign (b) Adobe Sign (c) Dropbox Sign.  
Risks: Stub divergence from real provider semantics → Mitigation: design domain interface boundary + capture required fields (signer identity, timestamp, providerRef, hash).  
Follow-up: Replace stub no later than before GA readiness gate.

### Required Signature Metadata Fields

```
provider: 'stub'
providerRef: UUID (placeholder)
signedAt: ISO timestamp
signerUserId: internal user id
artifactHash: SHA-256 of PDF bytes post-sign
versionId: linked executed form version
immutable: true
```

## 2. File Type & Size Policy

Decision: Accept PDF only for executed forms & proxy materials; allow PDF, PNG, JPG for supporting documents.  
Rationale: Limit complexity, preserve rendering & hashing consistency.  
Alternatives: Allow DOCX (conversion overhead), allow XLSX (low value early).  
Risks: Issuer originally uses Word → Mitigation: instruct to export to PDF in UI guidance.  
Follow-up: Add DOCX ingestion only if >25% issuers request.

Limits:

- Executed forms: max 2MB (single page typical).
- Proxy materials: max 15MB (large statement).
- Supporting: max 10MB each.  
  Exceed Handling: 413 error with guidance.

## 3. Retention & Archival

Decision: Keep all historical versions; never hard-delete; mark superseded.  
Rationale: Regulatory & audit defensibility.  
Alternatives: Hard delete upon replace (non-compliant), external cold storage.  
Risks: Storage growth → Mitigation: plan lifecycle policy after 12 months (Phase 3+ backlog).  
Follow-up: Add archival job + glacier tier evaluation.

## 4. Watermarking DRAFT

Decision: Defer dynamic watermarking until after core flow; store Boolean `isDraft` and apply client-side overlay when viewing non-approved versions.  
Rationale: Avoid PDF byte rewriting complexity now.  
Alternatives: Server-side stamping library (pdf-lib), preprocessor service.  
Risks: User distribution of un-watermarked raw file → Mitigation: UI clearly labels status; audit logs track distribution events (future).  
Follow-up: Evaluate if regulatory requires actual embedded watermark.

## 5. Role Taxonomy & Approvals

Decision: Use interim roles: ADMIN, ISSUER_EDITOR, VIEWER. Approvals restricted to ADMIN in Phase 1/2.  
Rationale: Keep logic simple while role matrix clarifies.  
Alternatives: Granular roles (Legal, Finance, BoardSecretary).  
Risks: Over-broad approval rights → Mitigation: narrow in future when policy defined.  
Follow-up: Add role_claim table + policy mapping.

## 6. Deadline Warning Logic

Decision: Derive target readiness deadline = meetingDate - 14 days (configurable constant).  
Rationale: Conservative buffer for dissemination & corrections.  
Alternatives: Dynamic per jurisdiction calendar.  
Risks: Not jurisdiction-specific → Mitigation: store offset constant in config table for later regionalization.  
Follow-up: Collect issuer feedback to refine.

## 7. Evidence Hashing Standard

Decision: SHA-256 over raw uploaded bytes; store Base64 digest in `document_versions.hash_sha256`.  
Rationale: Standard, supported widely.  
Alternatives: SHA3-256 (overkill), MD5 (collision risk).  
Risks: Later provider includes embedded signature altering bytes → Mitigation: Post-sign hashing step at provider integration time; current executed forms hashed after final bytes fixed.

## 8. Supporting Document Requiredness & Readiness

Decision: Supporting documents NOT blocking Phase readiness unless flagged required; add boolean `isRequired` per supporting doc type (default false).  
Rationale: Many supporting docs are supplemental.  
Alternatives: All required (slows readiness).  
Risks: Misconfiguration hides gap → Mitigation: readiness endpoint returns arrays of missing required docs.  
Follow-up: Governance UI to manage required flags.

## 9. Correction Workflow

Decision: Allow new version upload only if latest version not APPROVED or user has ADMIN role performing replace action creating new PENDING_REVIEW version (original stays approved & immutable).  
Rationale: Preserve audit; enable corrections.  
Alternatives: In-place mutation (breaks immutability).  
Risks: Accidental proliferation of versions → Mitigation: UI warning + require reason field for replace.

## 10. Test Runner Confirmation

Decision: Use existing Jest (if present) else add minimal Jest config for contract/integration; Playwright already in repo for E2E.  
Rationale: Consistency with codebase.  
Alternatives: Vitest migration now (adds churn).  
Risks: Slightly slower tests vs Vitest → Mitigation: Keep suites lean.

## 11. Open Questions (Deferred)

| Deferred Item | Reason | Containment | Revisit | Owner |
| --- | --- | --- | --- | --- |
| Digital signature vendor selection | Procurement pending | Stub boundary | Before GA | TBD |
| Watermark server stamping | Complexity vs value | Client overlay | After role expansion | TBD |
| Automated archival policy | Not urgent early volumes | Keep all, monitor size | After 12 months data | TBD |
| Regional deadline offsets | Need jurisdiction matrix | Config constant | Post first 5 issuers | TBD |
| Granular approval roles | Not finalized by product | Restrict to ADMIN | Before multi-tenant scale | TBD |

## 12. Risk Register

| Risk | Impact | Likelihood | Mitigation | Owner |
| --- | --- | --- | --- | --- |
| Signature provider integration diverges from stub | Rework interface | Medium | Clearly define interface + metadata now | Eng |
| Large proxy PDF slows readiness | Latency > target | Low | Async hash + pre-signed direct upload later | Eng |
| Storage cost growth | Increased OpEx | Low | Lifecycle policy backlog | Eng/Ops |
| Approval audit gaps | Compliance concern | Medium | Detailed event logging Phase 2 | Eng |

## 13. Summary of Resolved NEEDS CLARIFICATION

All previously listed unknowns now have decisions or deferrals with containment.

---

Status: READY for Phase 1 design artifacts.
