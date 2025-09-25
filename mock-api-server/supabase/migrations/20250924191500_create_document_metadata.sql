-- Migration: create document metadata tables (documents, document_versions, document_history)
-- Timestamp: 2025-09-24 19:15:00 UTC
-- Notes: Initial permissive schema; RLS disabled for fast iteration. Future hardening will enable RLS and tighter policies.

-- 1. documents table
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  meeting_id text not null,
  task_id uuid null,
  title text not null,
  description text null,
  type text not null, -- proxy/supporting/dsm-document/etc.
  file_path text not null,
  file_type text null,
  file_size integer null,
  status text not null default 'UPLOADED',
  upload_date timestamptz null,
  uploaded_date timestamptz null,
  signed_date timestamptz null,
  authorized_date timestamptz null,
  completed_date timestamptz null,
  in_progress_date timestamptz null,
  deadline timestamptz null,
  history jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists documents_meeting_id_idx on public.documents (meeting_id);
create index if not exists documents_task_id_idx on public.documents (task_id);
create index if not exists documents_type_idx on public.documents (type);

-- 2. document_versions table (each upload / replacement)
create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version_number integer not null,
  storage_path text not null,
  file_type text null,
  file_size integer null,
  status text not null default 'UPLOADED',
  notes text null,
  hash text null,
  created_at timestamptz not null default now(),
  unique(document_id, version_number)
);

create index if not exists document_versions_document_id_idx on public.document_versions (document_id);

-- 3. document_history table (auditable events)
create table if not exists public.document_history (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version_id uuid null references public.document_versions(id) on delete set null,
  event_type text not null,
  actor text null, -- user identifier (future: FK to profiles/users)
  metadata jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists document_history_document_id_idx on public.document_history (document_id);
create index if not exists document_history_version_id_idx on public.document_history (version_id);

-- 4. Triggers to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_documents_updated_at on public.documents;
create trigger set_documents_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

-- 5. (Optional) Future RLS enablement placeholder
-- alter table public.documents enable row level security; -- (defer)
-- alter table public.document_versions enable row level security; -- (defer)
-- alter table public.document_history enable row level security; -- (defer)

-- 6. Comments for clarity
comment on table public.documents is 'Primary document metadata (one row per logical document).';
comment on table public.document_versions is 'Immutable file version records for each document.';
comment on table public.document_history is 'Event trail for document lifecycle actions.';

-- End migration
