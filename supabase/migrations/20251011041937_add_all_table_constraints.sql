-- Add primary keys and constraints to all tables
-- This fixes foreign key references and ensures data integrity across the schema

-- First, add default values for id columns to auto-generate on insert
ALTER TABLE public.clients ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."user" ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public.account ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public.meeting ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public.phase ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public.task ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public.document ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public.document_history ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public.digital_shareholder_meeting ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."comment" ALTER COLUMN id SET DEFAULT floor(random() * 9223372036854775807)::bigint;
ALTER TABLE public.signature ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."position" ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public.position_vote ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public.proposal ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public.notification ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public.mailing ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- Then, update any existing NULL ids with UUIDs
UPDATE public.clients SET id = gen_random_uuid()::text WHERE id IS NULL;
UPDATE public."user" SET id = gen_random_uuid()::text WHERE id IS NULL;
UPDATE public.account SET id = gen_random_uuid()::text WHERE id IS NULL;
UPDATE public.meeting SET id = gen_random_uuid()::text WHERE id IS NULL;
UPDATE public.phase SET id = gen_random_uuid()::text WHERE id IS NULL;
UPDATE public.task SET id = gen_random_uuid()::text WHERE id IS NULL;
UPDATE public.document SET id = gen_random_uuid()::text WHERE id IS NULL;
UPDATE public.document_history SET id = gen_random_uuid()::text WHERE id IS NULL;
UPDATE public.digital_shareholder_meeting SET id = gen_random_uuid()::text WHERE id IS NULL;
UPDATE public."comment" SET id = floor(random() * 9223372036854775807)::bigint WHERE id IS NULL;
UPDATE public.signature SET id = gen_random_uuid()::text WHERE id IS NULL;
UPDATE public."position" SET id = gen_random_uuid()::text WHERE id IS NULL;
UPDATE public.position_vote SET id = gen_random_uuid()::text WHERE id IS NULL;
UPDATE public.proposal SET id = gen_random_uuid()::text WHERE id IS NULL;
UPDATE public.notification SET id = gen_random_uuid()::text WHERE id IS NULL;
UPDATE public.mailing SET id = gen_random_uuid()::text WHERE id IS NULL;

-- ============================================================================
-- CLIENTS TABLE
-- ============================================================================
ALTER TABLE public.clients
ALTER COLUMN id SET NOT NULL;

ALTER TABLE public.clients
ADD CONSTRAINT clients_pkey PRIMARY KEY (id);

ALTER TABLE public.clients
ADD CONSTRAINT clients_ticker_unique UNIQUE (ticker);

-- ============================================================================
-- USER TABLE
-- ============================================================================
ALTER TABLE public."user"
ALTER COLUMN id SET NOT NULL;

ALTER TABLE public."user"
ADD CONSTRAINT user_pkey PRIMARY KEY (id);

ALTER TABLE public."user"
ADD CONSTRAINT user_email_unique UNIQUE (email);

-- ============================================================================
-- ACCOUNT TABLE
-- ============================================================================
ALTER TABLE public.account
ALTER COLUMN id SET NOT NULL;

ALTER TABLE public.account
ADD CONSTRAINT account_pkey PRIMARY KEY (id);

-- ============================================================================
-- MEETING TABLE
-- ============================================================================
ALTER TABLE public.meeting
ALTER COLUMN id SET NOT NULL;

ALTER TABLE public.meeting
ADD CONSTRAINT meeting_pkey PRIMARY KEY (id);

-- Add foreign key to clients
ALTER TABLE public.meeting
ADD CONSTRAINT meeting_ticker_fkey
FOREIGN KEY (ticker) REFERENCES public.clients(ticker) ON DELETE SET NULL;

-- ============================================================================
-- PHASE TABLE
-- ============================================================================
ALTER TABLE public.phase
ALTER COLUMN id SET NOT NULL;

ALTER TABLE public.phase
ADD CONSTRAINT phase_pkey PRIMARY KEY (id);

-- Add foreign key to meeting
ALTER TABLE public.phase
ADD CONSTRAINT phase_meeting_id_fkey
FOREIGN KEY (meeting_id) REFERENCES public.meeting(id) ON DELETE CASCADE;

-- ============================================================================
-- TASK TABLE
-- ============================================================================
ALTER TABLE public.task
ALTER COLUMN id SET NOT NULL;

ALTER TABLE public.task
ADD CONSTRAINT task_pkey PRIMARY KEY (id);

-- Add foreign keys
ALTER TABLE public.task
ADD CONSTRAINT task_meeting_id_fkey
FOREIGN KEY (meeting_id) REFERENCES public.meeting(id) ON DELETE CASCADE;

ALTER TABLE public.task
ADD CONSTRAINT task_phase_id_fkey
FOREIGN KEY (phase_id) REFERENCES public.phase(id) ON DELETE SET NULL;

-- ============================================================================
-- DOCUMENT TABLE
-- ============================================================================
ALTER TABLE public.document
ALTER COLUMN id SET NOT NULL;

ALTER TABLE public.document
ADD CONSTRAINT document_pkey PRIMARY KEY (id);

-- Add foreign key to meeting
ALTER TABLE public.document
ADD CONSTRAINT document_meeting_id_fkey
FOREIGN KEY (meeting_id) REFERENCES public.meeting(id) ON DELETE CASCADE;

-- ============================================================================
-- DOCUMENT_HISTORY TABLE
-- ============================================================================
ALTER TABLE public.document_history
ALTER COLUMN id SET NOT NULL;

ALTER TABLE public.document_history
ADD CONSTRAINT document_history_pkey PRIMARY KEY (id);

-- Add foreign key to document
ALTER TABLE public.document_history
ADD CONSTRAINT document_history_document_id_fkey
FOREIGN KEY (document_id) REFERENCES public.document(id) ON DELETE CASCADE;

-- ============================================================================
-- DIGITAL_SHAREHOLDER_MEETING TABLE
-- ============================================================================
ALTER TABLE public.digital_shareholder_meeting
ALTER COLUMN id SET NOT NULL;

ALTER TABLE public.digital_shareholder_meeting
ADD CONSTRAINT digital_shareholder_meeting_pkey PRIMARY KEY (id);

-- Add foreign key to meeting
ALTER TABLE public.digital_shareholder_meeting
ADD CONSTRAINT digital_shareholder_meeting_meeting_id_fkey
FOREIGN KEY (meeting_id) REFERENCES public.meeting(id) ON DELETE CASCADE;

-- ============================================================================
-- COMMENT TABLE
-- ============================================================================
ALTER TABLE public."comment"
ALTER COLUMN id SET NOT NULL;

ALTER TABLE public."comment"
ADD CONSTRAINT comment_pkey PRIMARY KEY (id);

-- Add foreign keys
ALTER TABLE public."comment"
ADD CONSTRAINT comment_document_id_fkey
FOREIGN KEY (document_id) REFERENCES public.document(id) ON DELETE CASCADE;

ALTER TABLE public."comment"
ADD CONSTRAINT comment_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE SET NULL;

-- ============================================================================
-- SIGNATURE TABLE
-- ============================================================================
ALTER TABLE public.signature
ALTER COLUMN id SET NOT NULL;

ALTER TABLE public.signature
ADD CONSTRAINT signature_pkey PRIMARY KEY (id);

-- Add foreign key to document
ALTER TABLE public.signature
ADD CONSTRAINT signature_document_id_fkey
FOREIGN KEY (document_id) REFERENCES public.document(id) ON DELETE CASCADE;

-- ============================================================================
-- POSITION TABLE
-- ============================================================================
ALTER TABLE public."position"
ALTER COLUMN id SET NOT NULL;

ALTER TABLE public."position"
ADD CONSTRAINT position_pkey PRIMARY KEY (id);

-- Add foreign key to meeting
ALTER TABLE public."position"
ADD CONSTRAINT position_meeting_id_fkey
FOREIGN KEY (meeting_id) REFERENCES public.meeting(id) ON DELETE CASCADE;

-- ============================================================================
-- POSITION_VOTE TABLE
-- ============================================================================
ALTER TABLE public.position_vote
ALTER COLUMN id SET NOT NULL;

ALTER TABLE public.position_vote
ADD CONSTRAINT position_vote_pkey PRIMARY KEY (id);

-- Add foreign keys
ALTER TABLE public.position_vote
ADD CONSTRAINT position_vote_position_id_fkey
FOREIGN KEY (position_id) REFERENCES public."position"(id) ON DELETE CASCADE;

-- ============================================================================
-- PROPOSAL TABLE
-- ============================================================================
ALTER TABLE public.proposal
ALTER COLUMN id SET NOT NULL;

ALTER TABLE public.proposal
ADD CONSTRAINT proposal_pkey PRIMARY KEY (id);

-- Add foreign key to meeting
ALTER TABLE public.proposal
ADD CONSTRAINT proposal_meeting_id_fkey
FOREIGN KEY (meeting_id) REFERENCES public.meeting(id) ON DELETE CASCADE;

-- ============================================================================
-- NOTIFICATION TABLE
-- ============================================================================
ALTER TABLE public.notification
ALTER COLUMN id SET NOT NULL;

ALTER TABLE public.notification
ADD CONSTRAINT notification_pkey PRIMARY KEY (id);

-- Add foreign key to user
ALTER TABLE public.notification
ADD CONSTRAINT notification_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;

-- ============================================================================
-- MAILING TABLE
-- ============================================================================
ALTER TABLE public.mailing
ALTER COLUMN id SET NOT NULL;

ALTER TABLE public.mailing
ADD CONSTRAINT mailing_pkey PRIMARY KEY (id);

-- Add foreign key to meeting
ALTER TABLE public.mailing
ADD CONSTRAINT mailing_meeting_id_fkey
FOREIGN KEY (meeting_id) REFERENCES public.meeting(id) ON DELETE CASCADE;

-- ============================================================================
-- TABULATION_REPORT TABLE (already has NOT NULL id)
-- ============================================================================
ALTER TABLE public.tabulation_report
ADD CONSTRAINT tabulation_report_pkey PRIMARY KEY (id);

-- Add foreign key to meeting and unique constraint
ALTER TABLE public.tabulation_report
ADD CONSTRAINT tabulation_report_meeting_id_fkey
FOREIGN KEY (meeting_id) REFERENCES public.meeting(id) ON DELETE CASCADE;

ALTER TABLE public.tabulation_report
ADD CONSTRAINT tabulation_report_meeting_id_unique UNIQUE (meeting_id);

-- ============================================================================
-- DSM_CONFIG TABLE - Add foreign key now that meeting has primary key
-- ============================================================================
ALTER TABLE public.dsm_config
ADD CONSTRAINT dsm_config_meeting_id_fkey
FOREIGN KEY (meeting_id) REFERENCES public.meeting(id) ON DELETE CASCADE;

-- ============================================================================
-- HELPFUL COMMENTS
-- ============================================================================
COMMENT ON CONSTRAINT clients_pkey ON public.clients IS 'Primary key for clients table';
COMMENT ON CONSTRAINT clients_ticker_unique ON public.clients IS 'Ensure unique ticker symbol per client';
COMMENT ON CONSTRAINT user_pkey ON public."user" IS 'Primary key for user table';
COMMENT ON CONSTRAINT user_email_unique ON public."user" IS 'Ensure unique email per user';
COMMENT ON CONSTRAINT account_pkey ON public.account IS 'Primary key for account table';
COMMENT ON CONSTRAINT meeting_pkey ON public.meeting IS 'Primary key for meeting table';
COMMENT ON CONSTRAINT phase_pkey ON public.phase IS 'Primary key for phase table';
COMMENT ON CONSTRAINT task_pkey ON public.task IS 'Primary key for task table';
COMMENT ON CONSTRAINT document_pkey ON public.document IS 'Primary key for document table';
COMMENT ON CONSTRAINT document_history_pkey ON public.document_history IS 'Primary key for document_history table';
COMMENT ON CONSTRAINT digital_shareholder_meeting_pkey ON public.digital_shareholder_meeting IS 'Primary key for digital_shareholder_meeting table';
COMMENT ON CONSTRAINT comment_pkey ON public."comment" IS 'Primary key for comment table';
COMMENT ON CONSTRAINT signature_pkey ON public.signature IS 'Primary key for signature table';
COMMENT ON CONSTRAINT position_pkey ON public."position" IS 'Primary key for position table';
COMMENT ON CONSTRAINT position_vote_pkey ON public.position_vote IS 'Primary key for position_vote table';
COMMENT ON CONSTRAINT proposal_pkey ON public.proposal IS 'Primary key for proposal table';
COMMENT ON CONSTRAINT notification_pkey ON public.notification IS 'Primary key for notification table';
COMMENT ON CONSTRAINT mailing_pkey ON public.mailing IS 'Primary key for mailing table';
COMMENT ON CONSTRAINT tabulation_report_pkey ON public.tabulation_report IS 'Primary key for tabulation_report table';
COMMENT ON CONSTRAINT tabulation_report_meeting_id_unique ON public.tabulation_report IS 'One tabulation report per meeting';
COMMENT ON CONSTRAINT dsm_config_meeting_id_fkey ON public.dsm_config IS 'Foreign key to meeting table';
