# BetaNXT Issuer Portal

BetaNXT Issuer Portal is a Next.js application for managing shareholder meetings, voting activity, tabulation, and reporting. The repository also contains `mock-api-server`, a schema-driven mock backend used for local development and Playwright tests.

## Prerequisites

- Node.js 24 (see [`.node-version`](.node-version))
- pnpm 11 (`corepack enable` will use the version pinned in `package.json`)
- Docker and the Supabase CLI when running a local Supabase stack

## Getting started

```bash
corepack enable
pnpm install
cp issuer-portal/env.template issuer-portal/.env.local
cp mock-api-server/env.template mock-api-server/.env.local
pnpm dev
```

The portal runs on `http://localhost:3000`; the mock API runs on `http://localhost:3001`. Configure local variables before starting the apps. Never commit secrets or service-role keys. See [issuer portal environment setup](issuer-portal/ENV_SETUP.md) and [mock API environment setup](mock-api-server/ENV_SETUP.md) for the full configuration and Supabase workflow.

## Common commands

Run commands from the repository root unless noted otherwise.

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the portal and mock API through Turbo. |
| `pnpm run lint` | Run the repository linter. |
| `pnpm --dir issuer-portal run type-check` | Type-check the Next.js portal. |
| `pnpm test` | Run Playwright tests for both workspaces. |
| `pnpm build` | Build the issuer portal. |
| `pnpm format` | Format repository files with Prettier. |
| `pnpm --dir issuer-portal run generate:all-types` | Regenerate OpenAPI and database-facing types. |

The portal-local `lint` script still targets an obsolete Next.js command; use the root `pnpm run lint` command above.

## Repository layout

| Path | Purpose |
| --- | --- |
| `issuer-portal/` | Next.js application, components, contexts, and end-to-end tests. |
| `mock-api-server/` | Mock API routes, Supabase schema, OpenAPI documents, and seed data. |
| `domain-models/` | Shared domain and generated schema types. |
| `docs/`, `specs/` | Product, implementation, and operational documentation. |

## Client-aware chart colors

Voting charts use one shared semantic palette so the tabulation grid, tabulation charts, and reporting charts do not drift apart. The active client's primary and secondary brand colors anchor the first two roles; source colors are restrained `color-mix()` variants, and outcome colors remain semantic for legibility.

| Role                            | Palette source           |
| ------------------------------- | ------------------------ |
| Registered / DTC                | Client primary color     |
| Beneficial / non-DTC            | Client secondary color   |
| Web, Print, IVR                 | Derived source colors    |
| For, Against, Abstain, Withhold | Dedicated outcome colors |

The implementation lives in [`issuer-portal/utils/vote-chart-colors.ts`](issuer-portal/utils/vote-chart-colors.ts). Use its semantic CSS variables and their paired `contrastColor` values for text over chart fills. Do not derive chart colors independently in individual components.

## Testing

Playwright specs live in [`issuer-portal/tests`](issuer-portal/tests). The test suite expects the portal, mock API, and seeded test data to be available. For focused runs, start in `issuer-portal/` and use:

```bash
npx playwright test tests/e2e/tabulation-enhancements.spec.ts
```

See [`issuer-portal/tests/README.md`](issuer-portal/tests/README.md) for test structure and debugging guidance.
