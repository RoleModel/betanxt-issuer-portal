-- Add account_email column to position table (added to seed but missing from initial schema)
ALTER TABLE public."position" ADD COLUMN IF NOT EXISTS account_email TEXT DEFAULT NULL;
