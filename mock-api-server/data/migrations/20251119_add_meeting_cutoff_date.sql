-- Add voting cutoff date (business day before meeting)
ALTER TABLE public.meeting
  ADD COLUMN IF NOT EXISTS cutoff_date DATE DEFAULT NULL;

COMMENT ON COLUMN public.meeting.cutoff_date IS 'Voting cutoff date (previous business day before meeting). Original param name - cutoffDate.';
