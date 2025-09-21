# POST /api/documents/{docType}/{versionId}/approve

Purpose: Approve a proxy material version currently in PENDING_REVIEW.
Auth: ADMIN only

Path Params:

- docType: proxy material type
- versionId: uuid

Request Body (application/json):

```json
{ "meetingId": "uuid", "comment": "optional approval note" }
```

Validations:

- Parent state must be PENDING_REVIEW
- versionId must equal latest_version_id

Response 200:

```json
{
  "parentId": "uuid",
  "approvedVersionId": "uuid",
  "state": "APPROVED"
}
```

Errors:

- 400 INVALID_STATE
- 404 VERSION_NOT_FOUND
- 409 NOT_LATEST_VERSION
- 403 FORBIDDEN
