# POST /api/documents/forms/{formType}/sign-digital

Purpose: Produce executed version for a generated form through digital signature stub. Auth: ADMIN or ISSUER_EDITOR

Path Params:

- formType: FORM_OF_PROXY | VIF | CONTROLLED_ACCOUNT_REPORT

Request Body (application/json):

```json
{
  "meetingId": "uuid",
  "signerUserId": "uuid"
}
```

Constraints:

- Form must be in FORM_GENERATED state.
- signerUserId must match authenticated user unless ADMIN override.

Response 201:

```json
{
  "formId": "uuid",
  "executedVersionId": "uuid",
  "state": "EXECUTED",
  "signature": {
    "provider": "stub",
    "signedAt": "iso-timestamp",
    "artifactHash": "base64-sha256"
  }
}
```

Errors:

- 400 INVALID_STATE (form not FORM_GENERATED)
- 404 FORM_NOT_FOUND
- 409 ALREADY_EXECUTED
- 403 FORBIDDEN_SIGNER
