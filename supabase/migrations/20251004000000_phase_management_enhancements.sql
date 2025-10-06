-- Phase Management & DSM Enhancements Migration
-- Feature: 002-fix-phase-1
-- Date: 2025-10-04

-- =====================================================================
-- PHASE TABLE ENHANCEMENTS
-- =====================================================================

-- Add new columns to existing phase table
ALTER TABLE public.phase 
ADD COLUMN IF NOT EXISTS phase_number INTEGER,
ADD COLUMN IF NOT EXISTS completion_criteria JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS auto_advance_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Create phase status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE phase_status_enum AS ENUM ('not_started', 'in_progress', 'completed', 'blocked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update status column to use enum (if not already)
-- First, update any existing text values to match enum
UPDATE public.phase SET status = LOWER(status) WHERE status IS NOT NULL;

-- Add unique constraint for phase_number per meeting
ALTER TABLE public.phase 
DROP CONSTRAINT IF EXISTS unique_phase_per_meeting,
ADD CONSTRAINT unique_phase_per_meeting UNIQUE (meeting_id, phase_number);

-- Create index for phase queries
CREATE INDEX IF NOT EXISTS idx_phases_meeting_status ON public.phase(meeting_id, status);

-- Add check constraint for auto_advance_enabled
ALTER TABLE public.phase 
DROP CONSTRAINT IF EXISTS check_auto_advance_phases,
ADD CONSTRAINT check_auto_advance_phases 
CHECK (auto_advance_enabled = true OR phase_number >= 7);

-- Add check constraint for completed_at
ALTER TABLE public.phase 
DROP CONSTRAINT IF EXISTS check_completed_at_required,
ADD CONSTRAINT check_completed_at_required 
CHECK (status != 'completed' OR completed_at IS NOT NULL);

COMMENT ON COLUMN public.phase.phase_number IS 'Phase sequence number (1-8)';
COMMENT ON COLUMN public.phase.completion_criteria IS 'Array of required conditions for phase completion';
COMMENT ON COLUMN public.phase.auto_advance_enabled IS 'Whether phase should auto-advance when criteria met';
COMMENT ON COLUMN public.phase.started_at IS 'Timestamp when phase was started';
COMMENT ON COLUMN public.phase.completed_at IS 'Timestamp when phase was completed';

-- =====================================================================
-- TASK TABLE ENHANCEMENTS
-- =====================================================================

-- Create task enums
DO $$ BEGIN
    CREATE TYPE task_status_enum AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_priority_enum AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to existing task table
ALTER TABLE public.task 
ADD COLUMN IF NOT EXISTS priority task_priority_enum DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS assigned_to TEXT REFERENCES public."user"(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS completion_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS dependencies JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for task queries
CREATE INDEX IF NOT EXISTS idx_tasks_phase_status ON public.task(phase_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.task(assigned_to);

-- Add check constraint for completion_date
ALTER TABLE public.task 
DROP CONSTRAINT IF EXISTS check_completion_date_required,
ADD CONSTRAINT check_completion_date_required 
CHECK (status != 'completed' OR completion_date IS NOT NULL);

COMMENT ON COLUMN public.task.priority IS 'Task priority level';
COMMENT ON COLUMN public.task.assigned_to IS 'User ID of assigned user';
COMMENT ON COLUMN public.task.completion_date IS 'Timestamp when task was completed';
COMMENT ON COLUMN public.task.dependencies IS 'Array of task IDs that must complete first';
COMMENT ON COLUMN public.task.metadata IS 'Additional task-specific data';

-- =====================================================================
-- DOCUMENT TABLE ENHANCEMENTS
-- =====================================================================

-- Create document enums
DO $$ BEGIN
    CREATE TYPE document_upload_status_enum AS ENUM ('uploading', 'completed', 'failed', 'processing');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_sync_status_enum AS ENUM ('pending', 'synced', 'error');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_upload_source_enum AS ENUM ('taskbar', 'meeting_documents', 'bulk_upload');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to existing document table
ALTER TABLE public.document 
ADD COLUMN IF NOT EXISTS original_filename TEXT,
ADD COLUMN IF NOT EXISTS upload_status document_upload_status_enum DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS sync_status document_sync_status_enum DEFAULT 'synced',
ADD COLUMN IF NOT EXISTS storage_path TEXT,
ADD COLUMN IF NOT EXISTS upload_source document_upload_source_enum,
ADD COLUMN IF NOT EXISTS uploaded_by TEXT REFERENCES public."user"(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create indexes for document queries
CREATE INDEX IF NOT EXISTS idx_documents_meeting_sync ON public.document(meeting_id, sync_status);
CREATE INDEX IF NOT EXISTS idx_documents_upload_status ON public.document(upload_status, created_at);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.document(uploaded_by);

-- Delete duplicate documents, keeping only the one with the highest id (most recent)
DELETE FROM public.document a
USING public.document b
WHERE a.meeting_id = b.meeting_id
  AND a.title = b.title
  AND a.id < b.id;

-- Add unique constraint for filename per meeting
ALTER TABLE public.document
DROP CONSTRAINT IF EXISTS unique_filename_per_meeting,
ADD CONSTRAINT unique_filename_per_meeting UNIQUE (meeting_id, title);

-- Fix documents with completed status but no storage_path
UPDATE public.document
SET upload_status = 'completed'::document_upload_status_enum
WHERE upload_status IS NULL;

-- Set storage_path for completed documents that don't have one (use file_path as fallback)
UPDATE public.document
SET storage_path = file_path
WHERE upload_status = 'completed' AND storage_path IS NULL AND file_path IS NOT NULL;

-- Note: Not adding check constraint for storage_path to allow legacy documents without it

COMMENT ON COLUMN public.document.original_filename IS 'Original filename before any processing';
COMMENT ON COLUMN public.document.upload_status IS 'Current upload status of the document';
COMMENT ON COLUMN public.document.sync_status IS 'Synchronization status across display areas';
COMMENT ON COLUMN public.document.storage_path IS 'Path in Supabase storage';
COMMENT ON COLUMN public.document.upload_source IS 'Source interface where document was uploaded';
COMMENT ON COLUMN public.document.uploaded_by IS 'User ID who uploaded the document';
COMMENT ON COLUMN public.document.metadata IS 'Document-specific metadata';

-- =====================================================================
-- NEW REPORT TABLE
-- =====================================================================

-- Create report enums
DO $$ BEGIN
    CREATE TYPE report_type_enum AS ENUM ('phase_progress', 'document_summary', 'task_completion', 'dsm_attendance');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_status_enum AS ENUM ('pending', 'generating', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_format_enum AS ENUM ('pdf', 'csv', 'xlsx', 'json');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create report table
DROP TABLE IF EXISTS public.report CASCADE;
CREATE TABLE public.report (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    meeting_id TEXT NOT NULL REFERENCES public.meeting(id) ON DELETE CASCADE,
    type report_type_enum NOT NULL,
    name TEXT NOT NULL,
    status report_status_enum DEFAULT 'pending' NOT NULL,
    parameters JSONB DEFAULT '{}'::jsonb,
    output_format report_format_enum NOT NULL,
    file_path TEXT,
    file_size BIGINT,
    generation_date TIMESTAMP WITH TIME ZONE,
    requested_by TEXT NOT NULL REFERENCES public."user"(id) ON DELETE SET NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for report queries
CREATE INDEX idx_reports_meeting_type ON public.report(meeting_id, type);
CREATE INDEX idx_reports_status_date ON public.report(status, created_at);
CREATE INDEX idx_reports_requested_by ON public.report(requested_by);

-- Add check constraints
ALTER TABLE public.report 
ADD CONSTRAINT check_report_generation_date 
CHECK (status != 'completed' OR generation_date IS NOT NULL);

ALTER TABLE public.report 
ADD CONSTRAINT check_report_file_path 
CHECK (status != 'completed' OR file_path IS NOT NULL);

ALTER TABLE public.report 
ADD CONSTRAINT check_report_error_message 
CHECK (status != 'failed' OR error_message IS NOT NULL);

COMMENT ON TABLE public.report IS 'Generated reports for meetings';
COMMENT ON COLUMN public.report.type IS 'Type of report generated';
COMMENT ON COLUMN public.report.parameters IS 'Report-specific configuration parameters';
COMMENT ON COLUMN public.report.output_format IS 'Format of the generated report file';

-- =====================================================================
-- NEW DSM PARTICIPANT TABLE (Enhanced from digital_shareholder_meeting)
-- =====================================================================

-- Create DSM participant enums
DO $$ BEGIN
    CREATE TYPE dsm_participant_role_enum AS ENUM ('participant', 'presenter', 'guest', 'moderator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dsm_participant_status_enum AS ENUM ('invited', 'registered', 'confirmed', 'attended', 'no_show');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create new dsm_participant table
DROP TABLE IF EXISTS public.dsm_participant CASCADE;
CREATE TABLE public.dsm_participant (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    meeting_id TEXT NOT NULL REFERENCES public.meeting(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    company TEXT,
    role dsm_participant_role_enum NOT NULL,
    status dsm_participant_status_enum DEFAULT 'invited' NOT NULL,
    registration_data JSONB DEFAULT '{}'::jsonb,
    attendance_data JSONB DEFAULT '{}'::jsonb,
    invited_at TIMESTAMP WITH TIME ZONE,
    registered_at TIMESTAMP WITH TIME ZONE,
    attended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create unique constraint for email per meeting
ALTER TABLE public.dsm_participant 
ADD CONSTRAINT unique_participant_per_meeting UNIQUE (meeting_id, email);

-- Create indexes for DSM participant queries
CREATE INDEX idx_dsm_participants_meeting_role ON public.dsm_participant(meeting_id, role);
CREATE INDEX idx_dsm_participants_status ON public.dsm_participant(status, updated_at);
CREATE INDEX idx_dsm_participants_email ON public.dsm_participant(email);

-- Add check constraints
ALTER TABLE public.dsm_participant 
ADD CONSTRAINT check_dsm_registered_at 
CHECK (status = 'invited' OR registered_at IS NOT NULL);

ALTER TABLE public.dsm_participant 
ADD CONSTRAINT check_dsm_attended_at 
CHECK (status != 'attended' OR attended_at IS NOT NULL);

ALTER TABLE public.dsm_participant 
ADD CONSTRAINT check_dsm_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

COMMENT ON TABLE public.dsm_participant IS 'Digital Shareholder Meeting participants with enhanced role management';
COMMENT ON COLUMN public.dsm_participant.role IS 'Participant role in the meeting';
COMMENT ON COLUMN public.dsm_participant.status IS 'Current participation status';
COMMENT ON COLUMN public.dsm_participant.registration_data IS 'Form responses and preferences from registration';
COMMENT ON COLUMN public.dsm_participant.attendance_data IS 'Join time, duration, and interaction data';

-- =====================================================================
-- NEW ATTENDEE LIST TABLE
-- =====================================================================

-- Create attendee list enums
DO $$ BEGIN
    CREATE TYPE attendee_list_type_enum AS ENUM ('participants', 'presenters', 'guests', 'all_attendees', 'actual_attendees');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendee_list_format_enum AS ENUM ('csv', 'xlsx', 'pdf');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendee_list_generation_status_enum AS ENUM ('pending', 'generating', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create attendee_list table
DROP TABLE IF EXISTS public.attendee_list CASCADE;
CREATE TABLE public.attendee_list (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    meeting_id TEXT NOT NULL REFERENCES public.meeting(id) ON DELETE CASCADE,
    list_type attendee_list_type_enum NOT NULL,
    format attendee_list_format_enum NOT NULL,
    filters JSONB DEFAULT '{}'::jsonb,
    participant_count INTEGER NOT NULL DEFAULT 0,
    file_path TEXT,
    file_size BIGINT,
    generation_status attendee_list_generation_status_enum DEFAULT 'pending' NOT NULL,
    generated_by TEXT NOT NULL REFERENCES public."user"(id) ON DELETE SET NULL,
    generated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days') NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for attendee list queries
CREATE INDEX idx_attendee_lists_meeting_type ON public.attendee_list(meeting_id, list_type);
CREATE INDEX idx_attendee_lists_status ON public.attendee_list(generation_status, created_at);
CREATE INDEX idx_attendee_lists_generated_by ON public.attendee_list(generated_by);
CREATE INDEX idx_attendee_lists_expires_at ON public.attendee_list(expires_at);

-- Add check constraints
ALTER TABLE public.attendee_list 
ADD CONSTRAINT check_attendee_list_file_path 
CHECK (generation_status != 'completed' OR file_path IS NOT NULL);

ALTER TABLE public.attendee_list 
ADD CONSTRAINT check_attendee_list_expires_at 
CHECK (expires_at > created_at);

COMMENT ON TABLE public.attendee_list IS 'Generated attendee lists for download';
COMMENT ON COLUMN public.attendee_list.list_type IS 'Type of attendee list';
COMMENT ON COLUMN public.attendee_list.filters IS 'Applied filters (role, status, date range)';
COMMENT ON COLUMN public.attendee_list.participant_count IS 'Number of participants in the list';
COMMENT ON COLUMN public.attendee_list.expires_at IS 'When the generated file expires';

-- =====================================================================
-- UPDATE TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =====================================================================

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for tables with updated_at
DROP TRIGGER IF EXISTS update_phase_updated_at ON public.phase;
CREATE TRIGGER update_phase_updated_at
    BEFORE UPDATE ON public.phase
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_updated_at ON public.task;
CREATE TRIGGER update_task_updated_at
    BEFORE UPDATE ON public.task
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_document_updated_at ON public.document;
CREATE TRIGGER update_document_updated_at
    BEFORE UPDATE ON public.document
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_report_updated_at ON public.report;
CREATE TRIGGER update_report_updated_at
    BEFORE UPDATE ON public.report
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dsm_participant_updated_at ON public.dsm_participant;
CREATE TRIGGER update_dsm_participant_updated_at
    BEFORE UPDATE ON public.dsm_participant
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================================

-- Enable RLS on new tables
ALTER TABLE public.report ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dsm_participant ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendee_list ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (to be enhanced based on auth requirements)
-- Reports: Users can view their own requested reports
CREATE POLICY "Users can view their own reports"
    ON public.report FOR SELECT
    USING (requested_by = current_setting('request.jwt.claims')::json->>'sub');

-- DSM Participants: Users associated with meeting can view
CREATE POLICY "Users can view DSM participants for their meetings"
    ON public.dsm_participant FOR SELECT
    USING (
        meeting_id IN (
            SELECT meeting_id FROM public.meeting 
            WHERE client_id IN (
                SELECT client_id FROM public.account 
                WHERE id IN (
                    SELECT account_id FROM public."user" 
                    WHERE id = current_setting('request.jwt.claims')::json->>'sub'
                )
            )
        )
    );

-- Attendee Lists: Users can view their own generated lists
CREATE POLICY "Users can view their own attendee lists"
    ON public.attendee_list FOR SELECT
    USING (generated_by = current_setting('request.jwt.claims')::json->>'sub');

-- =====================================================================
-- MIGRATION COMPLETE
-- =====================================================================

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';


