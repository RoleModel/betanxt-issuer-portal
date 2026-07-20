# Issuer Portal Environment & Deployment Checklist

This document consolidates the environment variable requirements and deployment steps for the current document upload & metadata phase.

## 1. Environment Variables

Create a local `.env` (or `.env.local`) based on `env.template` and add the new Supabase keys required for server-side operations.

Required (Frontend + Server):

```
NEXT_PUBLIC_API_BASE_URL         # Base URL for mock-api-server or production API
NEXT_PUBLIC_SUPABASE_URL         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY    # Public anon key (safe for browser)
```

Server-only (DO NOT expose in client bundle):

```
SUPABASE_SERVICE_ROLE_KEY        # In mock-api-server (.env) already
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY  # TEMP: only in local dev if bypass is needed (will be removed when RLS enforced)
```

Development convenience flags:

```
NEXT_PUBLIC_BYPASS_AUTH=true     # Enables admin client usage in browser (local only)
NEXT_PUBLIC_BYPASS_USER_ID=dev-user-123
NEXT_PUBLIC_BYPASS_USER_ROLE=ADMIN
```

Security Note: Remove `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` before production. Use server-side helpers (`lib/serverSupabase.ts`) for privileged operations.

## 2. Supabase Migrations

Apply migrations found under `mock-api-server/supabase/migrations`:

```
20250924182000_create_documents_bucket.sql
20250924191500_create_document_metadata.sql
```

Local workflow:

1. Start Supabase locally (if using CLI):
   ```bash
   supabase start
   ```
2. Run migrations (via CLI or the existing npm task):
   ```bash
   cd mock-api-server
   npm run supabase:start   # if not already running
   # OR manually: supabase migration up --db-url $DATABASE_URL
   ```
3. Validate seed (optional):
   ```bash
   npm run seed:validate
   ```

## 3. Document Upload Flow (Current Phase)

1. Client calls `useDocuments().uploadDocumentVersion(meetingId, documentType, file, notes?)`
2. Repository posts multipart form to `/api/documents/types/{documentType}/upload`
3. File stored in `documents` bucket at path: `{meetingId}/{documentType}/{timestamp}_{rand}.{ext}`
4. Endpoint returns provisional metadata (no persistent `document_versions` row yet)
5. Fallback logic (if route fails): direct storage upload + OpenAPI document create

## 4. Future Persistence Hardening (Next Phase)

Planned enhancements (no action now):

- Insert `documents` + `document_versions` rows transactionally in upload route
- Add history event to `document_history`
- Enable RLS with policies (meeting membership)
- Remove service role key from any client-exposed context

## 5. Deployment (Vercel)

See **[docs/VERCEL_ENV.md](../docs/VERCEL_ENV.md)** for the full checklist (correct mock API hostname, Supabase project ref, and past-meeting verification).

Minimum issuer-portal production variables:

```
NEXT_PUBLIC_API_BASE_URL=https://bn-mock-api-server.vercel.app/api
NEXT_PUBLIC_SUPABASE_URL=https://vfgjzlcakdrpsbzuqklz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=***
AUTH_TRUST_HOST=true
NEXTAUTH_SECRET=***
```

Do **not** set `NEXTAUTH_URL` on Vercel. Do **not** set `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` in production.

## 6. Regenerating Types

If the OpenAPI schema changes:

```bash
cd issuer-portal
npm run generate:types
```

If database types change (after altering Prisma or Supabase):

```bash
cd mock-api-server
npm run generate:db-types
```

## 7. Smoke Test After Deploy

1. Visit a meeting page listing documents – expect empty or existing list.
2. Upload a file via UI – expect provisional document entry with status `UPLOADED`.
3. Confirm object appears in Supabase Storage (documents bucket).
4. Check network response includes `_meta.provisional=true` (expected until persistence logic added).

## 8. Troubleshooting

| Symptom | Likely Cause | Fix |
| --- | --- | --- |
| 403 on upload | Missing anon key or bucket policies tightened | Verify env vars / bucket policies |
| 500 on upload route | Service role key missing for server client | Add `SUPABASE_SERVICE_ROLE_KEY` (server only) |
| Provisional never replaced | Persistence phase not implemented yet | Planned next phase migration |
| Type errors in tests | Vitest types missing; project uses Playwright only | Remove or convert Vitest tests |

## 9. Cleanup Tasks (Optional Now)

- Remove legacy direct storage calls (`uploadDocument`, `uploadDSMDocument`) once repository fully owns flows.
- Migrate provisional responses into DB-backed rows.
- Introduce signed URL generation for private bucket access.

---

This checklist will evolve as we move to RLS-protected, versioned document lifecycle management.
