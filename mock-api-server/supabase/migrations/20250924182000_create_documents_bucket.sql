-- Migration: create documents storage bucket and permissive dev policies
-- Timestamp: 2025-09-24 18:20:00 UTC

-- 1. Create bucket if not exists
insert into storage.buckets (id, name, public)
select 'documents', 'documents', true
where not exists (select 1 from storage.buckets where id = 'documents');

-- 2. Policies (dev-friendly). Adjust or tighten for production later.
-- Note: storage.objects may already have existing policies; we add guarded by names to avoid duplicates.
-- Supabase does not support IF NOT EXISTS for policy names; wrap in DO block.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'documents_read'
  ) THEN
    EXECUTE 'create policy documents_read on storage.objects for select using (bucket_id = ''documents'')';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'documents_insert'
  ) THEN
    EXECUTE 'create policy documents_insert on storage.objects for insert with check (bucket_id = ''documents'')';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'documents_update'
  ) THEN
    EXECUTE 'create policy documents_update on storage.objects for update using (bucket_id = ''documents'') with check (bucket_id = ''documents'')';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'documents_delete'
  ) THEN
    EXECUTE 'create policy documents_delete on storage.objects for delete using (bucket_id = ''documents'')';
  END IF;
END$$;

-- 3. (Optional) Future: restrict to authenticated role only; for now available to anon for local dev if RLS enabled.
-- alter policy documents_read on storage.objects to to authenticated; (Skip now for simplicity.)

-- 4. Comment for team
comment on bucket documents is 'Primary application document storage bucket (consolidated from forms/proxy/supporting).';
