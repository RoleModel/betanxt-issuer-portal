-- Post-schema alterations. Must sort AFTER the generated *_initial_schema.sql
-- (which drops and recreates all core tables on every regeneration).

-- Add account_email column to position table (added to seed but missing from initial schema)
ALTER TABLE public."position" ADD COLUMN IF NOT EXISTS account_email TEXT DEFAULT NULL;

-- The OpenAPI generator emits JSON/TEXT for these columns; convert to JSONB
-- to match the seed data casts and prior behavior (002-mvp-enhancements).
ALTER TABLE public.clients
  ALTER COLUMN enabled_features TYPE JSONB USING enabled_features::jsonb,
  ALTER COLUMN enabled_features SET DEFAULT '["documents","mailing","tabulation","reports","fileTransfer","agenda"]'::jsonb;

ALTER TABLE public.meeting
  ALTER COLUMN tabulation_distribution TYPE JSONB USING tabulation_distribution::jsonb;
