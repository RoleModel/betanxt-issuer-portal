# GET /api/documents/{docType}/history

Purpose: List versions for a document with status history.
Auth: ADMIN or ISSUER_EDITOR or VIEWER

Path Params:

- docType

Query Params:

- meetingId: uuid
- type: (for proxy/supporting subtype) required when multiple of same kind

Response 200:

```json
{
  "parentId": "uuid",
  "type": "PROXY_STATEMENT",
  "versions": [
    { "versionId": "uuid", "number": 1, "state": "APPROVED", "createdAt": "iso" },
    { "versionId": "uuid", "number": 2, "state": "UPLOADED", "createdAt": "iso" }
  ]
}
```

Errors:

- 404 DOCUMENT_NOT_FOUND
