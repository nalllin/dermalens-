create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  concern_type text not null,
  area text not null,
  created_at timestamptz not null default now(),
  status text not null default 'active'
);

create table if not exists public.case_entries (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  symptoms_json jsonb not null default '[]'::jsonb,
  skin_type text not null,
  duration_text text not null,
  current_products_text text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.uploaded_images (
  id uuid primary key default gen_random_uuid(),
  case_entry_id uuid not null references public.case_entries (id) on delete cascade,
  image_url text not null,
  captured_at timestamptz not null default now(),
  image_quality_score numeric(4, 2) not null default 0.8
);

create table if not exists public.ai_assessments (
  id uuid primary key default gen_random_uuid(),
  case_entry_id uuid not null references public.case_entries (id) on delete cascade,
  likely_issue text not null,
  confidence numeric(4, 2) not null,
  severity text not null,
  reason_summary text not null,
  suggested_medications_json jsonb not null default '[]'::jsonb,
  suggested_creams_json jsonb not null default '[]'::jsonb,
  am_routine_json jsonb not null default '[]'::jsonb,
  pm_routine_json jsonb not null default '[]'::jsonb,
  observation_window text not null,
  escalation_note text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.progress_summaries (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  current_entry_id uuid not null references public.case_entries (id) on delete cascade,
  previous_entry_id uuid not null references public.case_entries (id) on delete cascade,
  trend text not null,
  change_summary text not null,
  recommendation text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  frequency_days integer not null default 7,
  next_send_at timestamptz not null,
  enabled boolean not null default true,
  channel text not null default 'email'
);

create index if not exists idx_cases_user_id on public.cases (user_id);
create index if not exists idx_case_entries_case_id on public.case_entries (case_id);
create index if not exists idx_uploaded_images_entry_id on public.uploaded_images (case_entry_id);
create index if not exists idx_ai_assessments_entry_id on public.ai_assessments (case_entry_id);
create index if not exists idx_progress_case_id on public.progress_summaries (case_id);
create index if not exists idx_reminders_case_id on public.reminders (case_id);
create index if not exists idx_reminders_next_send_at on public.reminders (next_send_at);

alter table public.users enable row level security;
alter table public.cases enable row level security;
alter table public.case_entries enable row level security;
alter table public.uploaded_images enable row level security;
alter table public.ai_assessments enable row level security;
alter table public.progress_summaries enable row level security;
alter table public.reminders enable row level security;

create policy "Users can read own profile"
on public.users
for select
using (auth.uid() = id);

create policy "Users can manage own profile"
on public.users
for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can manage own cases"
on public.cases
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own case entries"
on public.case_entries
for all
using (
  exists (
    select 1
    from public.cases
    where public.cases.id = case_entries.case_id
      and public.cases.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.cases
    where public.cases.id = case_entries.case_id
      and public.cases.user_id = auth.uid()
  )
);

create policy "Users can manage own uploaded images"
on public.uploaded_images
for all
using (
  exists (
    select 1
    from public.case_entries
    join public.cases on public.cases.id = public.case_entries.case_id
    where public.case_entries.id = uploaded_images.case_entry_id
      and public.cases.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.case_entries
    join public.cases on public.cases.id = public.case_entries.case_id
    where public.case_entries.id = uploaded_images.case_entry_id
      and public.cases.user_id = auth.uid()
  )
);

create policy "Users can manage own assessments"
on public.ai_assessments
for all
using (
  exists (
    select 1
    from public.case_entries
    join public.cases on public.cases.id = public.case_entries.case_id
    where public.case_entries.id = ai_assessments.case_entry_id
      and public.cases.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.case_entries
    join public.cases on public.cases.id = public.case_entries.case_id
    where public.case_entries.id = ai_assessments.case_entry_id
      and public.cases.user_id = auth.uid()
  )
);

create policy "Users can manage own progress summaries"
on public.progress_summaries
for all
using (
  exists (
    select 1
    from public.cases
    where public.cases.id = progress_summaries.case_id
      and public.cases.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.cases
    where public.cases.id = progress_summaries.case_id
      and public.cases.user_id = auth.uid()
  )
);

create policy "Users can manage own reminders"
on public.reminders
for all
using (
  exists (
    select 1
    from public.cases
    where public.cases.id = reminders.case_id
      and public.cases.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.cases
    where public.cases.id = reminders.case_id
      and public.cases.user_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('case-images', 'case-images', true)
on conflict (id) do nothing;
