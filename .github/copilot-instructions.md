## BetaNXT Issuer Portal – AI Agent Quick Guide

Purpose: Proxy voting & shareholder meeting management. Monorepo (Turborepo) with two Next.js 15 apps plus Supabase. Keep everything schema‑first and type‑safe.

### 1. Core Structure

- `issuer-portal/` (frontend, port 3000)
- `mock-api-server/` (backend + OpenAPI spec, port 3001)
- `supabase/` (migrations, seeds, storage config)
- Document workflow additions: migrations add `documents`, `document_versions`, `document_history`; storage bucket `documents`.

### 2. Golden Workflow (API / Data Changes)

OpenAPI (edit `mock-api-server/openapi-schema/openapi.yaml`) → `npm run generate:postgres-schema` → (optionally regenerate seeds) → `supabase db reset` → `npm run generate:db-types && npx openapi-typescript ... -o types/api.ts` → MANUALLY update domain model transforms in `mock-api-server/domain-models/api/*.ts` (add new fields) → regenerate routes if script present.

### 3. Domain Model Rules

- Never trust auto-gen for business logic; transformations (snake_case→camelCase) are manual.
- Every new OpenAPI field must appear in: DB migration (auto), generated types (auto), domain transform (manual), and any create/update function. Missing mapping causes silent data loss.
- Standard return envelope: `{ data?, error?:{ message, statusCode? } }`.

### 4. Document Repository (Frontend)

- Use `domain-models/documentRepository.ts` via hooks (`useDocuments`).
- Upload: `POST /api/documents/types/{documentType}/upload` (multipart) → provisional response; falls back to OpenAPI create + direct Supabase if route not finalized.
- Prefer `uploadDocumentVersion` over legacy `uploadDocument` / `uploadDSMDocument`.

### 5. Critical Commands

Setup: `npm install` (root) → `cd mock-api-server && npm run supabase:start` → schema workflow above → `npm run dev` (root). Regenerate types only: `npm run generate:db-types` + `npx openapi-typescript openapi-schema/openapi.yaml -o types/api.ts`. Seeds: `npm run generate:seeds` then `supabase db reset` (applies migrations + seeds). Playwright E2E (frontend dir): `npx playwright test` (UI mode: `--ui`).

### 6. Conventions

- Imports: external → design system → internal (`@/components/...`) → relative.
- State: SWR/React Query style hooks (check existing hooks before creating new fetch logic).
- Avoid `any`; do not bypass types with assertions.
- MUI styling via `sx`; avoid `<Typography>` inside `<TableCell>`.
- Keep server code (mock-api-server) free of frontend-only lint rules; lint focus is frontend.

### 7. Environment & Ports

Frontend 3000, API 3001, Supabase Studio 54323, API 54321, DB 54322. Dev flags: `NEXT_PUBLIC_BYPASS_AUTH=true` only locally. Backend uses Supabase keys in `.env.development.local` (service role server-only).

### 8. Common Pitfalls

- Forgetting domain transform update after spec change.
- Running builds without `npx turbo` (use `npx turbo run build`).
- Missing dependency in backend (`@snaplet/copycat`) → run `npm install` in `mock-api-server/`.
- Assuming upload route persists version rows (still provisional—watch for `provisional: true`).

### 9. When Adding a New Document Type

Add enum/fields in OpenAPI → regenerate schema/types → ensure storage path logic in upload route covers new type → update repository switch logic if needed → add migration only via generated flow (do not hand-edit prior migrations).

### 10. Definition of Done (Data/API Change)

Spec updated, migrations generated, DB reset succeeds, types regenerated, domain transforms updated, affected hooks adjusted, Playwright happy path passing.

For extended background see `CLAUDE.md` and feature docs under `issuer-portal/components/Documents/README.md`.

Feedback welcome—clarify any unclear step and this guide will be refined. 3. **Use the provided scripts** rather than searching for alternative approaches 4. **Refer to existing patterns** in the codebase for consistency 5. **Test changes** using the Playwright test suite before committing

The monorepo structure, build commands, and architectural patterns documented here represent the current working state of the system. Trust these instructions and only search for additional information if the provided guidance is incomplete or produces errors.
