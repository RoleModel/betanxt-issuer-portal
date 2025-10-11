-- Add primary key and unique constraint to dsm_config table
-- This fixes the "no unique or exclusion constraint matching the ON CONFLICT specification" error

-- Add primary key on id column
ALTER TABLE public.dsm_config
ADD CONSTRAINT dsm_config_pkey PRIMARY KEY (id);

-- Add unique constraint on meeting_id to ensure one config per meeting
ALTER TABLE public.dsm_config
ADD CONSTRAINT dsm_config_meeting_id_unique UNIQUE (meeting_id);

-- Note: Foreign key constraint to meeting table is not added because meeting table
-- does not have a primary key or unique constraint on the id column
-- This should be added in a future migration after meeting table constraints are fixed

-- Add helpful comments
COMMENT ON CONSTRAINT dsm_config_pkey ON public.dsm_config IS 'Primary key for dsm_config table';
COMMENT ON CONSTRAINT dsm_config_meeting_id_unique ON public.dsm_config IS 'Ensure one DSM config per meeting';
