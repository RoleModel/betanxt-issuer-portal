-- Post-schema alterations moved here to ensure they run after initial_schema.sql

-- Add account_email column to position table (added to seed but missing from initial schema)
ALTER TABLE public."position" ADD COLUMN IF NOT EXISTS account_email TEXT DEFAULT NULL;
