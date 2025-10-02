# Quickstart: Shareholder Proxy Document Management

This guide validates Phase 1 + readiness aspects of Phase 2.

## Prerequisites

- Running issuer portal dev environment
- Supabase local stack running
- Authenticated as ADMIN test user
- Meeting fixture or ability to create meeting (obtain meetingId)

## 1. Generate Forms

Forms auto-created on meeting creation.
Verify (UI or API): three form records present with state FORM_GENERATED.

## 2. Digital Sign One Form

POST `/api/documents/forms/FORM_OF_PROXY/sign-digital`

```json
{ "meetingId": "<MEETING_ID>", "signerUserId": "<ADMIN_USER_ID>" }
```

Expect state EXECUTED.

## 3. Upload Executed Second Form

POST multipart `/api/documents/forms/VIF/upload-executed`
Fields: meetingId, file (PDF <=2MB)
Expect state EXECUTED.

## 4. Leave Third Form Pending

No action (tests readiness behavior when incomplete if desired). For full readiness, execute all.

## 5. Upload Proxy Statement Draft

POST multipart `/api/documents/PROXY_STATEMENT/upload`
Fields: meetingId, file (PDF <=15MB)
Expect state UPLOADED.

## 6. Submit For Review (Implicit)

(If separate submit endpoint added later; currently treat UPLOADED as PENDING_REVIEW trigger by workflow or add explicit future route.) For now manually transition in implementation when triggering approval attempt (design note).

## 7. Approve Proxy Statement

POST `/api/documents/PROXY_STATEMENT/{versionId}/approve`
Body: `{ "meetingId": "<MEETING_ID>", "comment": "Initial approval" }`
Expect state APPROVED.

## 8. Upload Supporting Document (Optional)

POST multipart `/api/documents/PRESS_RELEASE/upload`
Expect state STORED.

## 9. Check Readiness

GET `/api/documents/readiness?meetingId=<MEETING_ID>`
Expect JSON with phase1Ready true (if all forms executed) and phase2Ready depends on approvals.

## 10. Replace Approved Proxy (Admin)

POST multipart `/api/documents/PROXY_STATEMENT/{approvedVersionId}/replace` with reason.
Expect new version state UPLOADED; approved version unchanged.
Approve again to restore readiness.

## 11. View History

GET `/api/documents/PROXY_STATEMENT/history?meetingId=<MEETING_ID>`
Expect ordered versions with states.

## Validation Checklist

- [ ] All forms executed produce immutable executedVersionId
- [ ] Approval creates ApprovalRecord
- [ ] Replacement retains previous approved version
- [ ] Readiness endpoint reflects missing items accurately
- [ ] Hash stored for each version

## Troubleshooting

| Symptom                         | Likely Cause          | Resolution                             |
| ------------------------------- | --------------------- | -------------------------------------- |
| 409 CONCURRENT_VERSION_CONFLICT | Parallel upload       | Retry with latest version number logic |
| 400 INVALID_STATE (approve)     | Not in PENDING_REVIEW | Ensure proper transition flow          |
| 415 UNSUPPORTED_MEDIA_TYPE      | Wrong file type       | Provide PDF/PNG/JPG per type           |
| 413/FILE_TOO_LARGE              | Exceeds limits        | Compress or split document             |

## Next Steps

Proceed to /tasks generation for implementation tasks.
