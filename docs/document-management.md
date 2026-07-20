# Document Management (Single Table Model)

This project currently uses a single legacy table named `document` to store all logical document records. Earlier multi-table designs (`documents`, `document_versions`, `document_history`) were deferred. The active implementation consolidates metadata, path, and a lightweight change log (history) directly in the JSON `history` column of the `document` table.

## Upload Flow

Endpoint: `POST /api/documents/types/[documentType]/upload`

Form Data Fields:

- `meetingId` (string, required)
- `file` (File, required)
- `versionNotes` (string, optional)
- `documentId` (string, optional) — if provided, the existing row is updated; otherwise a new row is created.

Behavior:

1. File streamed server-side and stored in Supabase Storage bucket `documents` under: `meetingId/documentType/timestamp_random.ext`.
2. Public URL returned (currently bucket public in dev; future: signed URLs).
3. If `documentId` absent: insert new row into `document`.
4. If `documentId` present: update file path, size, mime, status, timestamps, and append a history entry.
5. Response returns the document row shape (id, type, status, path, uploadedAt).

## History Entries

Each upload or update appends an object to the `history` JSON array:

```json
{
  "id": "<uuid>",
  "action": "CREATED_FILE" | "UPDATED_FILE",
  "user": "system" | "<future user identifier>",
  "fileName": "<original filename>",
  "fileSize": 12345,
  "fileType": "application/pdf",
  "timestamp": "2025-09-24T18:00:00.000Z",
  "notes": "optional version notes"
}
```

Seed data now creates an initial `CREATED_FILE` entry for each seeded document.

## Status Model

Statuses are centrally defined in `issuer-portal/utils/documentUtils.ts` and extended with a UI-only placeholder status:

- Persisted statuses include: `UPLOADED`, `SIGNED`, `COMPLETE`, `DRAFT`, etc.
- Extended (UI only): `NOT_UPLOADED` — used to represent placeholder DSM documents that do not yet have a backing `document` row.

When updating a status via utilities, `NOT_UPLOADED` is never persisted; it is mapped to `DRAFT` as a safe default.

## Seed Script Adjustments

File: `supabase/seed.ts`

- Document insert statements now populate the `history` column with a single JSON array containing one `CREATED_FILE` entry.
- `uploaded_date`, `created_at`, and `updated_at` are all aligned with the synthetic `uploadDate` used during seeding.

## Future Hardening (Optional Roadmap)

| Topic | Deferred Reason | Future Action |
| --- | --- | --- |
| Versioning | Complexity vs current need | Introduce `document_versions` table if audit fidelity required |
| Detailed RLS | Rapid iteration in dev | Add row-level policies once auth roles finalized |
| Signed URLs | Dev convenience | Switch storage bucket to private + generate signed URLs |
| User Attribution | Placeholder `system` value | Replace with authenticated user ID when auth context available |

## Migration Strategy (If/When Version Tables Adopted)

1. Create new normalized tables.
2. Backfill from existing `document` rows: create base row in `documents`, first `document_versions` from current file info, transform `history` into discrete `document_history` events.
3. Update upload route to write into normalized tables and return aggregated view.
4. Maintain compatibility shim that still supports legacy `document` reads during transition (feature flag).

## Testing Notes

- Upload route returns `201` with JSON response including `id`, `url`, `storagePath`.
- Failure modes: missing `meetingId`, missing `file`, oversize file, storage error, DB insert/update error.
- History append is atomic with update (a single `UPDATE` statement that writes full history array).

## Quick Example Response

```json
{
  "id": "c9e7f9dd-1f6c-4d2a-9c14-7b9c1d8a9d11",
  "meetingId": "wen-annual-2025",
  "type": "Proxy Statement",
  "status": "UPLOADED",
  "name": "Proxy_Statement_v2.pdf",
  "size": 2457612,
  "uploadedAt": "2025-09-24T18:12:03.512Z",
  "storagePath": "wen-annual-2025/Proxy%20Statement/1695588723512_ab12cd.pdf",
  "url": "https://.../documents/wen-annual-2025/Proxy%20Statement/...",
  "versionNotes": "Updated charts",
  "_meta": {
    "provisional": false,
    "note": "Document updated in single legacy table."
  }
}
```

## Developer Checklist (Current Flow)

- Add placeholder rows only in UI with `NOT_UPLOADED` if needed — do not persist.
- Always centralize status usage via `documentUtils` helpers.
- Use upload endpoint for all file writes (avoid direct client storage writes to ensure consistent pathing + history append).

---

For questions or planned enhancements, see the roadmap above or open an internal ticket.
