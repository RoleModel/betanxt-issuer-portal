# Repository Guidelines

**CRITICAL** You must run lint after any code modifications that you make. Do not use 'any' type inferences. Refer to existing patterns in the app when working with the api or components.

## Project Structure & Module Organization

The monorepo uses npm workspaces. `issuer-portal/` hosts the Next.js front end with feature folders such as `components/`, `contexts/`, and `utils/`; page routes reside in `app/`. Domain models and generated client types live under `domain-models/`. `mock-api-server/` contains the Supabase schema, OpenAPI definitions, and seeds used to drive local data. Shared scripts live in `scripts/`, while reference docs and diagrams live in `docs/`, `specs/`, and `er-diagram.md`. End-to-end artifacts land in `issuer-portal/tests` and `playwright-report/`.

## Build, Test & Development Commands

From the repo root run `npm run dev` to start both workspaces through Turbo. `npm run build` compiles the Next.js app and prepares the mock server artifacts. Use `npm run test` for the Playwright suite, and `npm run clean` to reset workspace outputs. Inside `issuer-portal/`, `npm run lint`, `npm run type-check`, and `npm run format` keep code quality intact. Regenerate API typings with `npm run generate:all-types`.

## Coding Style & Naming Conventions

Formatting is enforced by Prettier (`prettier.config.js`) with 2-space indentation, LF line endings, no semicolons, and single quotes. Imports are auto-sorted by `@trivago/prettier-plugin-sort-imports`; use the `@/...` alias for local modules and group third-party modules first. Prefer PascalCase for React components, camelCase for functions and variables, and kebab-case for files except Next.js route conventions under `app/`. Commit only formatted code; run `npm run format` before pushing.

## Testing Guidelines

Playwright drives browser tests located in `issuer-portal/tests/e2e/*.spec.ts`. Name new specs with descriptive verbs (`user-login.spec.ts`) and colocate shared fixtures in `issuer-portal/tests`. Run the full suite with `npm run test`; add `--ui` or `--headed` when debugging. For unit-style scenarios, prefer lightweight tests under `issuer-portal/tests/*.test.ts` and ensure any new data contracts update `domain-models/generated-schema.ts`. Investigate flaky tests before merging and attach Playwright reports on failures.

## Commit & Pull Request Guidelines

Follow the existing Conventional-Commit-inspired prefixes (`feat:`, `fix:`, `chore:`) with an imperative summary, e.g., `fix: align document uploader validations`. Break large work into focused commits and keep them lint-clean. Pull requests should include: summary of user impact, notes on testing (`npm run test`, `npm run lint`), linked Linear/Jira ticket, and screenshots for UI changes. Mention env or migration dependencies explicitly and reference `ENV_SETUP.md` when configuration updates are required.

## Environment & Security Notes

Create `.env.local` from `issuer-portal/env.template` and keep Supabase service keys server-side only. Use the mock API by pointing `NEXT_PUBLIC_API_BASE_URL` at `http://localhost:3001`. Never commit generated secrets or Playwright reports; add sensitive overrides through Vercel or Supabase configuration.

[byterover-mcp]

[byterover-mcp]

You are given two tools from Byterover MCP server, including

## 1. `byterover-store-knowledge`

You `MUST` always use this tool when:

- Learning new patterns, APIs, or architectural decisions from the codebase
- Encountering error solutions or debugging techniques
- Finding reusable code patterns or utility functions
- Completing any significant task or plan implementation

## 2. `byterover-retrieve-knowledge`

You `MUST` always use this tool when:

- Starting any new task or implementation to gather relevant context
- Before making architectural decisions to understand existing patterns
- When debugging issues to check for previous solutions
- Working with unfamiliar parts of the codebase

## Learned User Preferences

- Affidavit upload and delete must not change meeting mailing status; keep those flows document-only unless product explicitly ties them to workflow.
- When CSM-editable values affect calculations (for example quorum percentage), persist them on the meeting and thread them through context and widgets instead of relying on UI-only defaults.

## Learned Workspace Facts

- Mailing timeline UI should follow meeting `currentStatus` and `statusDate`; do not treat affidavit presence as “mailing completed” or drive the timeline from affidavit timestamps alone.
- Tabulation PDF quorum labeling and `votesOverUnderQuorum` must use each meeting’s `quorumRequirement` (with shared helpers), not a hardcoded 50% or `0.5` multiplier on outstanding shares.
- Shared quorum math and display helpers live in `issuer-portal/utils/quorum.ts`; reuse them across gauges and export paths.
- Do not leave debug `console.*` calls in production UI components (mailing/timeline work included).
