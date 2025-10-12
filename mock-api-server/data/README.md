# Seed Data for Production Reset

This directory contains the database schema migrations and seed data that are bundled with the Vercel deployment.

## Purpose

The `/api/admin/reset-demo-data` endpoint uses these files to reset the demo database on demand. This is essential for the sales team to reset demos between client presentations.

## Contents

- `migrations/` - Database schema migration SQL files (copied from `../supabase/migrations/`)
- `seed.sql` - Complete seed data for demo database (copied from `../supabase/seed.sql`)

## Keeping Data in Sync

These files are automatically updated when you run:

```bash
npm run generate:seeds
```

Or manually with:

```bash
npm run sync:seed-data
```

## Important Notes

1. **These files must be committed to git** - They need to be available in the Vercel deployment
2. **File size** - seed.sql is ~19MB, which is acceptable for git but monitor for growth
3. **Updates** - Always sync after schema changes or seed data updates
4. **Vercel** - These files are read at runtime via Node.js fs operations (works in nodejs runtime)

## Reset Endpoint

POST `/api/admin/reset-demo-data`

This endpoint:

1. Drops and recreates the public schema
2. Applies all migrations from `data/migrations/`
3. Loads seed data from `data/seed.sql`
4. Returns statistics about the reset operation

Duration: ~30-60 seconds depending on database size
