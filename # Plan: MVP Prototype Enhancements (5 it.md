# Plan: MVP Prototype Enhancements (5 items)

Bundle 5 issuer-portal MVP enhancements as a single umbrella feature `002-mvp-enhancements`. Three are prototype-only UX/visibility changes (CSM file transfer scoping, CSM backup client search, automated tabulation distribution mock). Two require small data-model + UI work (per-client feature toggles, Excel positions export). All built with existing patterns (ClientContext, OpenAPI schema-first flow, `@react-pdf/renderer` sibling for `xlsx`, in-app notifications table).

## Phases

### Phase A — Spec Kit scaffolding (one-time)

- A1. Create branch `002-mvp-enhancements` from `main`.
- A2. `mkdir -p specs/002-mvp-enhancements && cp .specify/templates/spec-template.md specs/002-mvp-enhancements/spec.md` (script bug: `create-new-feature.sh` references repo-root `templates/` which doesn't exist — manual copy avoids silent empty file).
- A3. Populate `spec.md` with 5 user stories + FRs (one per enhancement). Mark each "prototype-only" item explicitly as non-production scope.
- A4. Run `.specify/scripts/bash/setup-plan.sh --json` to bootstrap `plan.md`.

### Phase B — Schema + types (foundation for B1+E) _blocks C2, C3, F_

- B1. Edit `mock-api-server/openapi-schema/openapi.yaml`:
  - Add `Client.enabledFeatures: string[]` (enum: `documents`, `mailing`, `tabulation`, `reports`, `fileTransfer`, `agenda`). Default = all enabled in seed.
  - Add `Meeting.tabulationDistribution` object: `{ enabled: boolean, startOffsetDays: number (default 15), recipients: string[], lastSentAt?: timestamp, nextScheduledAt?: timestamp }` — prototype config only, no scheduler.
- B2. Run schema-first flow: `npm run generate:postgres-schema` → `supabase db reset` → `npm run generate:db-types` → `npx openapi-typescript openapi-schema/openapi.yaml -o types/api.ts`.
- B3. **MANUAL** snake_case→camelCase transforms in `mock-api-server/domain-models/api/client.ts` and `meeting.ts` for the new fields. (Per repo rules — missing this causes silent data loss.)
- B4. Update seeds in `supabase/seed.ts` so every client gets all features enabled; a few clients (e.g., one demo client) get `fileTransfer` disabled to exercise the toggle.

### Phase C — Per-client feature toggles _depends on B_

- C1. New hook `issuer-portal/hooks/useClientFeatures.ts` — SWR-backed, returns `{ enabledFeatures, isEnabled(feature) }` for the active client (from `ClientContext`).
- C2. New helper `issuer-portal/utils/clientFeatures.ts` exporting `FEATURE_KEYS` enum + types.
- C3. Gate tabs in `issuer-portal/components/Navigation/EventTabs.tsx` — filter `Dashboard | Agenda | Mailing | Tabulation | Reports` by `isEnabled(...)`. Dashboard always on.
- C4. Event setup edit UI: add a "Services & Features" section to `MeetingInformationCard.tsx` (or new `ClientFeaturesCard` rendered in event setup) with checkboxes per feature. Visible only to CSM/ADMIN (use existing role check from `ClientContext`).
  - PATCH client via existing API (add route handler if missing under `mock-api-server/app/api/clients/[clientId]/route.ts`).
- C5. Apply CSM hover-reveal pattern (`opacity: 0 → 1 on parent hover`) to the edit affordance, per user preference in AGENTS.md.

### Phase D — CSM file transfer scoping _parallel with C_

- D1. Audit current global file-transfer entry point. Per exploration: `SecureFileTransferTable.tsx` is per-meeting; the "global CSM file transfer" appears in nav/sidebar. Locate via grep for `FileTransfer` outside `Meeting/`.
- D2. In `ClientAppSwitcher.tsx` / `Navigation/AppSidebar` (whichever owns the global link), remove the file-transfer entry when `session.role === 'CSM'` AND no `clientTicker` URL param is present.
- D3. Ensure the per-client file-transfer page (under `/[ticker]/...`) remains accessible — this is the only path CSMs may use.
- D4. Gate per-client visibility on `useClientFeatures().isEnabled('fileTransfer')` (ties to Phase C).

### Phase E — CSM backup client access (search-to-impersonate) _parallel with C, D_

- E1. Extend `ClientAppSwitcher.tsx`: for CSM users, show their assigned clients first, then a searchable Autocomplete (MUI `Autocomplete` with `freeSolo={false}`) listing all clients via `useClients()`.
- E2. Add a visual "Covering for…" badge in the AppBar when an active client is outside the CSM's assigned list (compare against `session.user.assignedClientIds`).
- E3. Data: ensure `User.assignedClientIds: string[]` exists on the CSM record (likely already present; verify in `openapi.yaml` User schema. If missing, add in Phase B1 batch).
- E4. No permission change — CSMs already have all-client access per `ClientContext.tsx:48`. This is purely a UX scope/affordance layer.

### Phase F — Automated tabulation distribution (prototype mock) _depends on B_

- F1. New "Distribution" panel inside Tabulation section (new file `issuer-portal/components/Tabulation/TabulationDistributionCard.tsx`). Shows:
  - Toggle: "Auto-deliver daily reports"
  - Start offset (default 15 days before meeting date)
  - Recipients chip input
  - Computed "Next delivery: <date>" using existing `meetingDate` + offset math
  - Read-only timeline of mock past deliveries
- F2. Persists to `Meeting.tabulationDistribution` via PATCH meeting (route exists).
- F3. Generate **mock notification rows** at seed time for any meeting within the 15-day window — insert into `notifications` table with `type='info'`, `title='Daily tabulation report available'`, `actionUrl=/[ticker]/meetings/[id]/tabulation`. No real scheduler is built; prototype demonstrates the workflow visually.
- F4. Render unread notification badge using existing notifications UI (verify in nav; if absent, surface in `Reports`/`Tabulation` header as inline alert).
- F5. Add disclaimer chip "Prototype — daily delivery not yet automated" on the panel.

### Phase G — Excel positions export _parallel with everything; depends only on existing PDF_

- G1. New `issuer-portal/utils/exportPositionsXlsx.ts`:
  - Use already-installed `xlsx@^0.18.5` (SheetJS) — no new dependency.
  - Mirror inputs/types of `exportPositionsPdf.tsx` (`ExportOptions`, same `Position[]` shape).
  - Build worksheet with columns matching `PositionsTable.tsx` headers (name, accountType, accountNumber, controlNumber, shares, sharesVoted, voteStatus, source, dateVoted).
  - Filename pattern: `positions-{meetingId}-{YYYYMMDD}.xlsx`.
- G2. Update `ProposalDetailsCard.tsx` button (line ~159) from single "Export Positions" Button to a MUI split button / menu: `Export → PDF | Excel`. Reuse existing `handleExportPositions` logic, branch on format.
- G3. Same UI affordance in any other position-list location surfaced during implementation (e.g., Positions tab if standalone).

### Phase E2 — HTML email delivery _parallel with C–G; F can consume in F4_

- E2-1. Add deps to `mock-api-server`: `resend`, `react-email`, `@react-email/components`, `@react-email/render`. Dev: `react-email` CLI for local preview.
- E2-2. Templates in `mock-api-server/emails/`:
  - **`DocumentUpdateNotification.tsx`** — matches the Figma frame (1058-82543). Sections:
    - **Header bar** (dark navy `#0E2A38`, white text): left-stacked `{meetingType}` (semibold) + `Document Update Notification` (regular, smaller); right-aligned BetaNXT wordmark logo (`<Img>` from CDN-hosted PNG asset).
    - **Greeting**: `Hello {issuerAccountName},`
    - **Body copy**: `A new document, <strong>{documentName}</strong>, has been added to your workflow and is ready for your review. Please log in to the portal and approve (or request changes) at your earliest convenience.`
    - **Document card** (light border, **green left rule `#3F8A3F` 4px**, padded): uploader avatar (rounded), uploader name (muted), document title (bold), description line, right-aligned upload date (muted), `View Document` link (anchor styled as link, color matches portal primary `#0E5A8A` or similar — confirm from existing design system tokens).
    - **Footer**: BetaNXT / 400 Regency Forest Dr #200 / Cary, NC 27518 / `www.betanxt.com` link.
  - **Props (typed in shared `mock-api-server/emails/types.ts`)**:
    ```
    DocumentUpdateNotificationProps = {
      meetingType: string                 // "Annual Meeting"
      issuerAccountName: string           // "{IssuerAccountName}"
      documentName: string                // "Proxy Notice"
      uploaderName: string                // "Sarah Chen"
      uploaderAvatarUrl?: string          // absolute URL; fallback initials block if absent
      documentDescription: string         // "Sarah Chen has uploaded the first draft of the Proxy Notice."
      uploadDate: string | Date           // formatted as "Jul 20" in template
      viewDocumentUrl: string             // absolute URL into portal
      portalBaseUrl: string               // for footer/cta absolute links
    }
    ```
  - Shared components: `mock-api-server/emails/components/{Layout,Header,Footer,DocumentCard,Button,Link}.tsx`. Hex tokens (`COLORS.navy`, `COLORS.accentGreen`, `COLORS.link`, `COLORS.muted`, `COLORS.border`) declared in `emails/styles.ts`. Width capped at 600px; table-based layout via `@react-email/components` (`<Container>`, `<Section>`, `<Row>`, `<Column>`).
  - Logo asset: stash `BetaNXT-logo.png` in `mock-api-server/public/email-assets/` and reference via `${portalBaseUrl}/email-assets/BetaNXT-logo.png` (avoid embedding/CIDs).
- E2-3. New `mock-api-server/lib/email/EmailService.ts`:
  - Port/adapter pattern: `interface EmailService { send(input: { to: string[], subject: string, react: ReactElement, replyTo?, cc?, bcc?, tags? }): Promise<{ id: string }> }`.
  - `ResendEmailService` adapter (default; requires `RESEND_API_KEY` env). Uses `@react-email/render` to produce HTML + plain-text fallback.
  - `NoopEmailService` for tests and local dev when key absent — logs to console, returns synthetic id; do not throw.
  - Factory `getEmailService()` selects based on `process.env.EMAIL_PROVIDER` (default `resend`; falls back to `noop` if no key in non-production).
- E2-4. New API route `mock-api-server/app/api/emails/send/route.ts` — POST `{ templateKey, props, to[] }`. Server-only; validates payload with Zod (one Zod schema per `templateKey`, discriminated union); never accepts raw HTML from clients. Returns `{ data: { id }}` or `{ error }`. `templateKey` registry maps `'document-update-notification' → DocumentUpdateNotification`.
- E2-5. Local preview dev tool: `mock-api-server/app/__emails/page.tsx` — lists templates, renders selected one with fixture props in an iframe. Available **only when `NODE_ENV !== 'production'`** (guard the route handler).
- E2-6. NPM script in `mock-api-server/package.json`: `"email:dev": "email dev --dir ./emails --port 3030"` for the react-email standalone dev server.
- E2-7. Env additions to `mock-api-server/.env.development.local.example`: `RESEND_API_KEY=`, `EMAIL_FROM="BetaNXT Issuer Portal <noreply@example.com>"`, `EMAIL_PROVIDER=resend`, `PORTAL_BASE_URL=http://localhost:3000`.
- E2-8. **Wire trigger**: when a new document version is uploaded for a meeting (existing `uploadDocumentVersion` flow in `domain-models/documentRepository.ts` → server route `/api/documents/types/{documentType}/upload`), after persisting the document the server route fires `POST /api/emails/send` with `templateKey='document-update-notification'`, recipients = the meeting's issuer account contacts. Implementation guards: feature-flag via `ENABLE_EMAILS=true` env so prototype emails are opt-in. Phase F's "Send daily report now" remains a future template — out of scope for this PR.
- E2-9. **Tests (NON-NEGOTIABLE per constitution)** — colocated where possible:
  - **Unit** (add minimal Vitest config in `mock-api-server` if not present; otherwise reuse existing test runner):
    - `EmailService` factory selects correct adapter per env.
    - `ResendEmailService.send` calls Resend client with rendered HTML + text fallback (mock `resend` client).
    - `NoopEmailService.send` returns synthetic id, logs once, does not throw on missing key.
    - Zod discriminated-union schema accepts valid `DocumentUpdateNotification` props and rejects each missing required field.
  - **Snapshot/render**: `DocumentUpdateNotification` renders to stable HTML with fixture props (`@react-email/render` → string snapshot). Catches accidental visual regressions.
  - **Contract** (Playwright integration): `POST /api/emails/send` returns `{ data: { id }}` on valid payload; 400 on invalid `templateKey`; 400 on missing prop; ensures `noop` adapter is used in test env.
  - **E2E** (Playwright): upload a new document version as a CSM/issuer in the seeded happy-path → assert one network request to `/api/emails/send` with `templateKey='document-update-notification'` and the expected recipient. Visit `/__emails` and assert the template renders with fixture props (smoke).
  - **Email compatibility lint**: assert rendered HTML uses `<table>` layout, has `alt` text on the logo `<img>`, container width ≤600px, includes plain-text fallback.
- E2-10. README in `mock-api-server/emails/README.md` documenting: how to add a template (template key, props, Zod schema, snapshot test), run `email:dev`, test with `noop` adapter, and required env for Resend.

### Phase H — Verification & cleanup _final_

- H1. Lint: `cd issuer-portal && npm run lint` and `cd mock-api-server && npm run lint` (mandatory per AGENTS.md — no `any` types, no unused imports).
- H2. Type-check: `npm run type-check` in both workspaces.
- H3. Playwright happy paths (frontend dir): existing tabulation, navigation, and document specs must still pass. Add minimal new specs:
  - CSM sees no global file transfer link.
  - CSM can switch to non-assigned client via autocomplete.
  - Tab hidden when client feature is disabled.
  - Excel download triggers (assert `download` event with `.xlsx` suffix).
  - Email "Send now" from tabulation distribution panel hits `/api/emails/send` and shows success toast (uses `noop` adapter in test env).
- H4. Email-specific test suite from E2-9 must be green (unit + snapshot + contract + E2E).
- H5. Manual smoke: log in as CSM (existing seed user), walk all 5 flows + render the email template at `/__emails`.
- H6. PR description references this plan + spec, lists migrations + new deps (`resend`, `react-email`, `@react-email/components`, `@react-email/render`), and flags the prototype-only items.

## Relevant files

**Schema-first foundation**

- `mock-api-server/openapi-schema/openapi.yaml` — add `Client.enabledFeatures`, `Meeting.tabulationDistribution`, verify `User.assignedClientIds`.
- `mock-api-server/domain-models/api/client.ts`, `meeting.ts` — manual transforms.
- `supabase/seed.ts` — populate new fields; seed mock distribution notifications.

**Feature toggles + CSM scoping**

- `issuer-portal/contexts/ClientContext.tsx` (line ~48) — already has CSM = all-clients; reuse for backup access.
- `issuer-portal/hooks/useClients.ts` — full client list source for autocomplete.
- `issuer-portal/components/Navigation/ClientAppSwitcher.tsx` — replace dropdown with searchable Autocomplete for CSMs + "Covering for…" badge.
- `issuer-portal/components/Navigation/EventTabs.tsx` — filter tabs by `useClientFeatures`.
- `issuer-portal/components/Meeting/MeetingInformationCard.tsx` — host new "Services & Features" CSM-only editor (or new sibling card).
- `issuer-portal/components/Meeting/SecureFileTransferTable.tsx` — gate by `isEnabled('fileTransfer')`.
- New: `issuer-portal/hooks/useClientFeatures.ts`, `issuer-portal/utils/clientFeatures.ts`.

**Tabulation distribution prototype**

- New: `issuer-portal/components/Tabulation/TabulationDistributionCard.tsx`.
- Reuse `notifications` table + endpoints in `mock-api-server/app/api/notifications/` (currently TODO — minimal `listNotifications` implementation needed if not surfacing already).
- `issuer-portal/contexts/MeetingContext.tsx` — already exposes `meetingDate`; reuse for offset math.

**Positions Excel export**

- New: `issuer-portal/utils/exportPositionsXlsx.ts` (mirrors `exportPositionsPdf.tsx`).
- `issuer-portal/components/Tabulation/ProposalDetailsCard.tsx` (line ~159) — split button.
- `issuer-portal/utils/exportPositionsPdf.tsx` — reference for shared `ExportOptions` type; consider extracting to `utils/exportPositions/types.ts`.

## Verification

1. `npm run lint` and `npm run type-check` in `issuer-portal/` pass cleanly.
2. `supabase db reset` from `mock-api-server/` succeeds after schema regen.
3. Playwright suite (root `npm run test`) passes; new specs cover the 4 flows in H3.
4. Manual smoke as seeded CSM user:
   - No global "File Transfer" entry in top-level nav.
   - Client switcher autocomplete lists assigned + searchable other clients; "Covering for…" badge appears when on non-assigned client.
   - On a meeting whose client has `fileTransfer` disabled, the per-client file transfer view is also hidden.
   - Event setup shows checkboxes; toggling Tabulation off hides the Tabulation tab on refresh.
   - Tabulation panel shows distribution config + at least one mock "Daily report delivered" notification for a meeting within 15 days.
   - Positions card → Export menu shows PDF and Excel; Excel download yields a valid `.xlsx` with the expected columns.
5. Confirm none of: affidavit-touching flows altered, quorum helpers altered, console.\* added in production components.

## Decisions

- **One umbrella spec (`002-mvp-enhancements`)** per user choice — single branch, single PR, ships as a coherent prototype increment.
- **Feature toggles modeled on Client, not Meeting** — contract/services live with the client; meeting inherits. (Override per meeting can be a future addition.)
- **Tabulation distribution is mock-only** — no cron, no real email. Seed-generated `notifications` rows + read-only UI demonstrate the future-state workflow.
- **CSM backup access = pure UX layer** — backend already permits all-client access for CSMs; we only change the picker affordance and add a "covering" badge.
- **Excel export uses already-installed `xlsx@0.18.5`** — no new dependency.
- **Scope excluded**: real scheduling/cron, RLS policy changes, email delivery, audit logging for client-coverage switches, multi-tenant licensing enforcement.

## Further Considerations

1. **CSM coverage audit trail** — should switching to a non-assigned client be logged? _Recommendation_: Not for prototype. Option A: skip (current plan). Option B: write a `client_access_events` row on switch.
2. **Feature-toggle granularity** — Client-level only, or also per-meeting override? _Recommendation_: Option A (Client-level only) for MVP. Option B (add `Meeting.featureOverrides`) deferred.
3. **Distribution recipients source** — free-text emails or pick from existing users? _Recommendation_: Option A (pick from meeting's existing user list via `useMeetingUsers` or equivalent) to avoid free-text validation; Option B (free-text) if user list isn't easily accessible.
