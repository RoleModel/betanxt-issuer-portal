# Environment Setup (Mock API Server & Shared Supabase Assets)

This document standardizes local developer onboarding for the consolidated `documents` storage bucket and database objects.

## 1. Prerequisites

- Node.js (see `package.json` engines, >=22.15.0)
- Supabase CLI installed: https://supabase.com/docs/guides/cli
- Docker running (for `supabase start` local stack) OR access to shared remote dev project.

## 2. Environment Variables

Create a `.env.local` (or `.env.development.local`) in `mock-api-server/` with at least:

```
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
# Optional: bypass RLS in front-end dev flows
NEXT_PUBLIC_BYPASS_AUTH=true
```

For a remote dev project, replace URLs/keys accordingly. Never commit real service role keys.

## 3. Start Local Supabase

```
npm run supabase:start
```

This launches the local Postgres + storage services.

## 4. Apply Migrations

If starting fresh (will wipe local data):

```
npm run supabase:reset
```

Otherwise just push new migrations:

```
supabase db push
```

The migration `20250924182000_create_documents_bucket.sql` will ensure a `documents` bucket and dev-friendly storage policies exist.

## 5. Ensure Documents Bucket (Idempotent Script)

The SQL migration should create it, but you can run the script safely:

```
npm run setup:storage
```

Output will log whether the bucket existed or was created.

## 6. Regenerate Types (Optional)

```
npm run generate:db-types
npm run generate:api-types
```

## 7. Running the Mock API Server

```
npm run dev
```

API available at: `http://127.0.0.1:3001/api`

## 8. Document Storage Conventions

- Single bucket: `documents`
- File path patterns currently (examples):
  - `documents/<meetingId>/<timestamp>_<random>.<ext>` (direct upload util)
  - `documents/<meetingId>/<file>` (DSM upload variant)
  - `documents/task-completions/<taskId>-completed-<epoch>.pdf` (generated task PDF)

Adjust patterns centrally in `issuer-portal/utils/supabaseStorage.ts` if needed.

## 9. Production Hardening TODOs

- Add restrictive storage RLS (authenticated-only + ownership / meeting membership checks)
- Signed URL generation for private documents
- Remove `NEXT_PUBLIC_BYPASS_AUTH` in production builds
- Implement audit logging for object operations

## 10. Troubleshooting

| Symptom               | Likely Cause                    | Fix                                                          |
| --------------------- | ------------------------------- | ------------------------------------------------------------ |
| 403 on storage upload | Missing policy or wrong bucket  | Verify migration applied & policies present in `pg_policies` |
| Bucket not found      | Migration skipped               | Run `npm run setup:storage`                                  |
| RLS insert failures   | Document table policies missing | Add / adjust RLS policies in upcoming DB migration           |

## 11. Remote Dev Sync

If using a shared remote Supabase project:

```
supabase link --project-ref <project-ref>
supabase db push
npm run setup:storage
```

Team members clone, link, and run the same commands to stay consistent.

---

This file will evolve as we add the real document table migrations and RLS policies.
