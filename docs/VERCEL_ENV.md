# Vercel environment checklist (issuer-portal + mock-api-server)

Use this when past meetings or seed data look missing on **remote** but work locally.

## Project URLs (rolemodel-software team)

| Project         | Production URL                        |
| --------------- | ------------------------------------- |
| issuer-portal   | https://mic-issuer-portal.vercel.app  |
| mock-api-server | https://bn-mock-api-server.vercel.app |

Do **not** use `issuer-portal-mock-api-server.vercel.app` (404) or `mock-api-server.vercel.app` (404).

## issuer-portal — required variables

| Variable | Correct value |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | `https://bn-mock-api-server.vercel.app/api` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://vfgjzlcakdrpsbzuqklz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key for **same** Supabase project |
| `AUTH_TRUST_HOST` | `true` (exactly — no trailing `\n`) |
| `NEXTAUTH_SECRET` | Strong secret (server) |

**Do not set `NEXTAUTH_URL` on Vercel** — it breaks cookie domains. `auth.ts` uses `trustHost: true`.

After changing production variables, **redeploy issuer-portal** so `NEXT_PUBLIC_*` values are baked into the client bundle.

## Sentry (issuer-portal)

Errors, tracing and Session Replay report to the `rolemodel-software` / `issuer-portal` Sentry project. The DSN is committed as a fallback in `instrumentation-client.ts` / `sentry.server.config.ts` / `sentry.edge.config.ts` — a DSN is a public write-only ingest key, so no environment variable is needed just to report events.

Source map upload is the part that needs a secret:

| Variable | Where | Notes |
| --- | --- | --- |
| `SENTRY_AUTH_TOKEN` | Vercel env + local `issuer-portal/.env.sentry-build-plugin` | Build-time only. Never committed — the filename is gitignored |
| `SENTRY_ORG` | optional | Defaults to `rolemodel-software` in `next.config.ts` |
| `SENTRY_PROJECT` | optional | Defaults to `issuer-portal` |

Generate or rotate the token at <https://rolemodel-software.sentry.io/settings/auth-tokens/> with the `project:releases` scope (add `project:read` if you also want to query issues over the API — the token `sentry wizard` creates does not have it).

Two gotchas that cost real time:

- **The plugin reads `.env.sentry-build-plugin` relative to the build's working directory**, which is `issuer-portal/`. `sentry wizard` writes it to the repo root, where the build never looks — hence "No auth token provided. Will not upload source maps." Copy it into `issuer-portal/`.
- **Turborepo filters the environment.** `SENTRY_AUTH_TOKEN` is listed in `passThroughEnv` in `turbo.json` so it reaches the build without becoming part of the cache key. Remove it from there and the token silently stops arriving on CI.

Build output is quiet unless `CI` is set (`silent: !process.env.CI`), so to confirm uploads locally run `CI=1 pnpm --filter issuer-portal run build` and look for "Successfully uploaded source maps to Sentry".

## mock-api-server — required variables

| Variable                    | Correct value                              |
| --------------------------- | ------------------------------------------ |
| `SUPABASE_URL`              | `https://vfgjzlcakdrpsbzuqklz.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role for **same** project          |

## Verify remote data (CLI)

```bash
# Past meetings exist (COMPLETE status, not "PAST")
curl -s "https://bn-mock-api-server.vercel.app/api/meetings?ticker=FOC&status=COMPLETE" | head -c 400

# Count all completed meetings
curl -s "https://bn-mock-api-server.vercel.app/api/meetings?status=COMPLETE" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('meetings',[])))"
```

Expect **8** COMPLETE meetings per seeded issuer (e.g. FOC, WEN) and **448** total COMPLETE rows.

## Supabase Studio

- Table name: **`meeting`** (singular)
- Past rows: **`status = 'COMPLETE'`**
- Not filtered by calendar year alone

## Reseed remote database

From `mock-api-server/` (uses `.env.local` Supabase credentials):

```bash
pnpm run generate:seeds && pnpm run seed:remote
```

## Local verification script

```bash
node scripts/verify-remote-stack.mjs
```
