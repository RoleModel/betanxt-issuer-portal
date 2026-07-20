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
- CSM-only UI controls (edit buttons, inline actions) should be hover-revealed with `opacity: 0` → `1` on parent hover; never always-visible for CSM users.
- Navigation actions (back buttons, breadcrumbs) should be context-aware — detect origin route and adjust label/destination accordingly (e.g. "Back to Event" vs "Back to Events").

## Learned Workspace Facts

- Mailing timeline UI should follow meeting `currentStatus` and `statusDate`; do not treat affidavit presence as “mailing completed” or drive the timeline from affidavit timestamps alone.
- Tabulation PDF quorum labeling and `votesOverUnderQuorum` must use each meeting’s `quorumRequirement` (with shared helpers), not a hardcoded 50% or `0.5` multiplier on outstanding shares.
- Shared quorum math and display helpers live in `issuer-portal/utils/quorum.ts`; reuse them across gauges and export paths.
- Do not leave debug `console.*` calls in production UI components (mailing/timeline work included).
- Shares voted/unvoted shown in charts are aggregated from `Position` records, not from `Meeting` fields. `useVotingTabulation.ts` computes: `totalShares` = sum of `position.shares`; `sharesVoted` = sum of `position.sharesVoted` for positions where `voteStatus === 'Voted'` (mixed case).
- The `/positions` API endpoint returns `{ positions: [...] }` — a wrapped object, not a plain array. Always extract `.positions` (or the equivalent domain helper) when consuming the response.
- Position queries use plain meeting IDs without the `eq.` prefix (e.g. `meetingId: eventId`), despite OpenAPI docs showing `eq.WEN-2024-AGM` in examples.
- `totalSharesOutstanding` on `Meeting` may arrive as a `number` at runtime despite TypeScript typing it as `string`. Use `String(value)` before calling string methods like `.trim()`.

# Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `pnpm dlx ultracite fix`
- **Check for issues**: `pnpm dlx ultracite check`
- **Diagnose setup**: `pnpm dlx ultracite doctor`

ESLint + Prettier + Stylelint (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**

- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**

- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**

- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When ESLint + Prettier + Stylelint Can't Help

ESLint + Prettier + Stylelint's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - ESLint + Prettier + Stylelint can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by ESLint + Prettier + Stylelint. Run `pnpm dlx ultracite fix` before committing to ensure compliance.
