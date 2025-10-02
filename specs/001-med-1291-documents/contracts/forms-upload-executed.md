# POST /api/documents/forms/{formType}/upload-executed

Purpose: Upload externally executed PDF.
Auth: ADMIN or ISSUER_EDITOR

Path Params:

- formType

Multipart Form Data Fields:

- meetingId: uuid (text field)
- file: PDF binary

Validations:

- PDF only, <= 2MB
- Form state must be FORM_GENERATED

Response 201:

```json
{
  "formId": "uuid",
  "executedVersionId": "uuid",
  "state": "EXECUTED"
}
```

Errors:

- 400 INVALID_STATE
- 400 FILE_TOO_LARGE
- 415 UNSUPPORTED_MEDIA_TYPE
- 404 FORM_NOT_FOUND
- 409 ALREADY_EXECUTED
