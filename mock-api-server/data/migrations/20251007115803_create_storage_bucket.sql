-- Migration: create documents storage bucket and permissive dev policies
-- Timestamp: 2025-10-07

-- 1. Create bucket if not exists
insert into storage.buckets (id, name, public)
select 'documents', 'documents', true
where not exists (select 1 from storage.buckets where id = 'documents');

-- 2. Drop existing policies if they exist (for clean migration)
drop policy if exists documents_read on storage.objects;
drop policy if exists documents_insert on storage.objects;
drop policy if exists documents_update on storage.objects;
drop policy if exists documents_delete on storage.objects;

-- 3. Create policies (dev-friendly). Adjust or tighten for production later.
create policy documents_read on storage.objects for select using (bucket_id = 'documents');
create policy documents_insert on storage.objects for insert with check (bucket_id = 'documents');
create policy documents_update on storage.objects for update using (bucket_id = 'documents') with check (bucket_id = 'documents');
create policy documents_delete on storage.objects for delete using (bucket_id = 'documents');

