create table if not exists public.quran_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  track text not null default 'revision' check (track in ('revision','memorization')),
  revision_level text not null default 'medium' check (revision_level in ('simple','medium','intensive')),
  plan_type text not null default 'two_year' check (plan_type in ('one_year','two_year','three_year','custom')),
  pages_per_day numeric(6,2) not null default 1 check (pages_per_day > 0),
  days_per_week integer not null default 6 check (days_per_week between 1 and 7),
  start_date date not null default current_date,
  expected_end_date date null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quran_juz_progress (
  program_id uuid not null references public.quran_programs(id) on delete cascade,
  juz_number integer not null check (juz_number between 1 and 30),
  status text not null default 'not_reviewed' check (status in ('not_reviewed','in_progress','mastered','needs_reinforcement')),
  updated_at timestamptz not null default now(),
  primary key (program_id,juz_number)
);

create table if not exists public.quran_surah_progress (
  program_id uuid not null references public.quran_programs(id) on delete cascade,
  surah_number integer not null check (surah_number between 1 and 114),
  status text not null default 'not_started' check (status in ('not_started','in_progress','memorized','mastered')),
  updated_at timestamptz not null default now(),
  primary key (program_id,surah_number)
);

create table if not exists public.quran_daily_checklists (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.quran_programs(id) on delete cascade,
  checklist_date date not null,
  listening boolean not null default false,
  new_memorization boolean not null default false,
  repeat_20 boolean not null default false,
  recent_linking boolean not null default false,
  distant_review boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(program_id,checklist_date)
);

create index if not exists quran_juz_program_idx on public.quran_juz_progress(program_id);
create index if not exists quran_surah_program_idx on public.quran_surah_progress(program_id);
create index if not exists quran_checklist_program_date_idx on public.quran_daily_checklists(program_id,checklist_date);

alter table public.quran_programs enable row level security;
alter table public.quran_juz_progress enable row level security;
alter table public.quran_surah_progress enable row level security;
alter table public.quran_daily_checklists enable row level security;

drop policy if exists "quran_programs_select_own" on public.quran_programs;
drop policy if exists "quran_programs_insert_own" on public.quran_programs;
drop policy if exists "quran_programs_update_own" on public.quran_programs;
drop policy if exists "quran_programs_delete_own" on public.quran_programs;
create policy "quran_programs_select_own" on public.quran_programs for select to authenticated using ((select auth.uid())=user_id);
create policy "quran_programs_insert_own" on public.quran_programs for insert to authenticated with check ((select auth.uid())=user_id);
create policy "quran_programs_update_own" on public.quran_programs for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "quran_programs_delete_own" on public.quran_programs for delete to authenticated using ((select auth.uid())=user_id);

drop policy if exists "quran_juz_select_own" on public.quran_juz_progress;
drop policy if exists "quran_juz_insert_own" on public.quran_juz_progress;
drop policy if exists "quran_juz_update_own" on public.quran_juz_progress;
drop policy if exists "quran_juz_delete_own" on public.quran_juz_progress;
create policy "quran_juz_select_own" on public.quran_juz_progress for select to authenticated using (exists(select 1 from public.quran_programs p where p.id=program_id and p.user_id=(select auth.uid())));
create policy "quran_juz_insert_own" on public.quran_juz_progress for insert to authenticated with check (exists(select 1 from public.quran_programs p where p.id=program_id and p.user_id=(select auth.uid())));
create policy "quran_juz_update_own" on public.quran_juz_progress for update to authenticated using (exists(select 1 from public.quran_programs p where p.id=program_id and p.user_id=(select auth.uid()))) with check (exists(select 1 from public.quran_programs p where p.id=program_id and p.user_id=(select auth.uid())));
create policy "quran_juz_delete_own" on public.quran_juz_progress for delete to authenticated using (exists(select 1 from public.quran_programs p where p.id=program_id and p.user_id=(select auth.uid())));

drop policy if exists "quran_surah_select_own" on public.quran_surah_progress;
drop policy if exists "quran_surah_insert_own" on public.quran_surah_progress;
drop policy if exists "quran_surah_update_own" on public.quran_surah_progress;
drop policy if exists "quran_surah_delete_own" on public.quran_surah_progress;
create policy "quran_surah_select_own" on public.quran_surah_progress for select to authenticated using (exists(select 1 from public.quran_programs p where p.id=program_id and p.user_id=(select auth.uid())));
create policy "quran_surah_insert_own" on public.quran_surah_progress for insert to authenticated with check (exists(select 1 from public.quran_programs p where p.id=program_id and p.user_id=(select auth.uid())));
create policy "quran_surah_update_own" on public.quran_surah_progress for update to authenticated using (exists(select 1 from public.quran_programs p where p.id=program_id and p.user_id=(select auth.uid()))) with check (exists(select 1 from public.quran_programs p where p.id=program_id and p.user_id=(select auth.uid())));
create policy "quran_surah_delete_own" on public.quran_surah_progress for delete to authenticated using (exists(select 1 from public.quran_programs p where p.id=program_id and p.user_id=(select auth.uid())));

drop policy if exists "quran_checklist_select_own" on public.quran_daily_checklists;
drop policy if exists "quran_checklist_insert_own" on public.quran_daily_checklists;
drop policy if exists "quran_checklist_update_own" on public.quran_daily_checklists;
drop policy if exists "quran_checklist_delete_own" on public.quran_daily_checklists;
create policy "quran_checklist_select_own" on public.quran_daily_checklists for select to authenticated using (exists(select 1 from public.quran_programs p where p.id=program_id and p.user_id=(select auth.uid())));
create policy "quran_checklist_insert_own" on public.quran_daily_checklists for insert to authenticated with check (exists(select 1 from public.quran_programs p where p.id=program_id and p.user_id=(select auth.uid())));
create policy "quran_checklist_update_own" on public.quran_daily_checklists for update to authenticated using (exists(select 1 from public.quran_programs p where p.id=program_id and p.user_id=(select auth.uid()))) with check (exists(select 1 from public.quran_programs p where p.id=program_id and p.user_id=(select auth.uid())));
create policy "quran_checklist_delete_own" on public.quran_daily_checklists for delete to authenticated using (exists(select 1 from public.quran_programs p where p.id=program_id and p.user_id=(select auth.uid())));

drop trigger if exists set_quran_programs_updated_at on public.quran_programs;
create trigger set_quran_programs_updated_at before update on public.quran_programs for each row execute function public.set_updated_at();
drop trigger if exists set_quran_juz_updated_at on public.quran_juz_progress;
create trigger set_quran_juz_updated_at before update on public.quran_juz_progress for each row execute function public.set_updated_at();
drop trigger if exists set_quran_surah_updated_at on public.quran_surah_progress;
create trigger set_quran_surah_updated_at before update on public.quran_surah_progress for each row execute function public.set_updated_at();
drop trigger if exists set_quran_checklist_updated_at on public.quran_daily_checklists;
create trigger set_quran_checklist_updated_at before update on public.quran_daily_checklists for each row execute function public.set_updated_at();
