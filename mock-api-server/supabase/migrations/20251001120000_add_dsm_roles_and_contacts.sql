-- Add fields for meeting roles and contacts
ALTER TABLE dsm_config 
ADD COLUMN dsm_enabled boolean DEFAULT true,
ADD COLUMN ioe_enabled boolean DEFAULT true,
ADD COLUMN dsm_producer_name text,
ADD COLUMN dsm_producer_email text,
ADD COLUMN inspector_name text,
ADD COLUMN inspector_email text,
ADD COLUMN speaker_list_doc_id text,
ADD COLUMN guest_link_registration_doc_id text;
