-- Migration: MVP Enhancements (002-mvp-enhancements)
-- Adds per-client feature toggles and meeting tabulation distribution config

-- Add enabled_features to clients table
-- Stores as JSONB array, e.g. ["documents","mailing","tabulation","reports","fileTransfer","agenda"]
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS enabled_features JSONB DEFAULT '["documents","mailing","tabulation","reports","fileTransfer","agenda"]'::jsonb;

COMMENT ON COLUMN clients.enabled_features IS 'Feature modules enabled for this client. Original param name - enabledFeatures.';

-- Add tabulation_distribution to meeting table
-- Stores prototype config for auto daily report delivery (no real scheduler)
ALTER TABLE public.meeting
  ADD COLUMN IF NOT EXISTS tabulation_distribution JSONB DEFAULT NULL;

COMMENT ON COLUMN meeting.tabulation_distribution IS 'Prototype config for automated daily tabulation report delivery. Original param name - tabulationDistribution.';
