# POST /api/documents/{docType}/{versionId}/replace

Purpose: Replace an APPROVED proxy material with a new UPLOADED version (ADMIN only). Auth: ADMIN

Path Params:

- docType
- versionId: current approved version id

Multipart Form Data:

- meetingId: uuid
- file: PDF
- reason: text (required)

Flow:

- Verify versionId is approved_version_id
- Create new version (version_number +1) state=UPLOADED
- Parent latest_version_id points to new version; approved_version_id unchanged (previous version)
- Parent state = UPLOADED

Response 201:

```json
{
  "parentId": "uuid",
  "newVersionId": "uuid",
  "previousApprovedVersionId": "uuid",
  "state": "UPLOADED"
}
```

Errors:

- 400 INVALID_STATE
- 404 VERSION_NOT_FOUND
- 403 FORBIDDEN
