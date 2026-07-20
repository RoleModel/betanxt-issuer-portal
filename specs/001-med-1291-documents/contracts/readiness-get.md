# GET /api/documents/readiness

Purpose: Aggregate readiness across meeting documents. Auth: ADMIN or ISSUER_EDITOR or VIEWER (read-only)

Query Params:

- meetingId: uuid (required)

Response 200:

```json
{
  "meetingId": "uuid",
  "phase1Ready": true,
  "phase2Ready": false,
  "overallReady": false,
  "outstandingPhase1": [],
  "outstandingPhase2": [
    {
      "type": "PROXY_STATEMENT",
      "expectedState": "APPROVED",
      "currentState": "UPLOADED"
    }
  ],
  "computedAt": "iso-timestamp"
}
```

Errors:

- 404 MEETING_NOT_FOUND
