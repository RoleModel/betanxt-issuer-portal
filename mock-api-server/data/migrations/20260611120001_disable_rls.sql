-- Disable Row Level Security on all tables
-- This is for development/staging - RLS should be properly configured for production

-- Disable RLS on all public tables
ALTER TABLE IF EXISTS public.account DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.comment DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.digital_shareholder_meeting DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.document DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.document_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dsm_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mailing DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.meeting DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notification DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.phase DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.position DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.position_vote DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.proposal DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.signature DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tabulation_report DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.task DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."user" DISABLE ROW LEVEL SECURITY;

-- Drop any existing RLS policies (if they exist)
DROP POLICY IF EXISTS "Service role has full access" ON public.clients;
DROP POLICY IF EXISTS "Service role has full access" ON public.account;
DROP POLICY IF EXISTS "Service role has full access" ON public.meeting;
DROP POLICY IF EXISTS "Service role has full access" ON public.document;
DROP POLICY IF EXISTS "Service role has full access" ON public.position;
DROP POLICY IF EXISTS "Service role has full access" ON public.proposal;
DROP POLICY IF EXISTS "Service role has full access" ON public.task;
DROP POLICY IF EXISTS "Service role has full access" ON public."user";
