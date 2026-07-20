# POST /api/documents/{docType}/upload

Purpose: Upload new proxy material or supporting document version. Auth: ADMIN or ISSUER_EDITOR

docType Path Param:

- proxy: PROXY_STATEMENT | ANNUAL_REPORT | NOTICE_OF_MEETING
- supporting: PRESS_RELEASE | ESG_REPORT | COMPENSATION_DISCLOSURE | OTHER

Multipart Form Data:

- meetingId: uuid
- file: PDF (proxy) | PDF/PNG/JPG (supporting)
- reason (optional text) (for replace action when previous APPROVED)

Behavior:

- If parent not exists create placeholder and transition.
- Assign version_number = 1 + current max.
- Set parent state: UPLOADED (proxy) or STORED (supporting).

Response 201:

```json
{
  "parentId": "uuid",
  "versionId": "uuid",
  "versionNumber": 2,
  "state": "UPLOADED"
}
```

Errors:

- 400 FILE_TOO_LARGE
- 415 UNSUPPORTED_MEDIA_TYPE
- 404 MEETING_NOT_FOUND
- 409 CONCURRENT_VERSION_CONFLICT
