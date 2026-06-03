# Vercel environment checklist (issuer-portal + mock-api-server)

Use this when past meetings or seed data look missing on **remote** but work locally.

## Project URLs (rolemodel-software team)

| Project | Production URL |
| --- | --- |
| issuer-portal | https://mic-issuer-portal.vercel.app |
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

## mock-api-server — required variables

| Variable | Correct value |
| --- | --- |
| `SUPABASE_URL` | `https://vfgjzlcakdrpsbzuqklz.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role for **same** project |

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
