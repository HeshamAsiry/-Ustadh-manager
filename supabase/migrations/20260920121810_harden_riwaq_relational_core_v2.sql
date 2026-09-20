create schema if not exists extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

do $$
begin
  if exists (
    select 1
    from pg_extension e
    join pg_namespace n on n.oid=e.extnamespace
    where e.extname='btree_gist' and n.nspname='public'
  ) then
    alter extension btree_gist set schema extensions;
  end if;
end $$;

alter table public.students
  add column if not exists legacy_id text,
  add column if not exists legacy_data jsonb,
  add column if not exists country_name text,
  add column if not exists group_id uuid;

alter table public.events
  add column if not exists legacy_id text,
  add column if not exists legacy_data jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname='students_teacher_legacy_id_key') then
    alter table public.students add constraint students_teacher_legacy_id_key unique (teacher_id, legacy_id);
  end if;
  if not exists (select 1 from pg_constraint where conname='events_teacher_legacy_id_key') then
    alter table public.events add constraint events_teacher_legacy_id_key unique (teacher_id, legacy_id);
  end if;
end $$;

create table if not exists public.student_groups (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  notes text,
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists student_groups_teacher_name_uidx on public.student_groups(teacher_id,name);
create index if not exists student_groups_teacher_idx on public.student_groups(teacher_id);
create index if not exists students_group_idx on public.students(group_id);
create index if not exists student_subjects_subject_id_idx on public.student_subjects(subject_id);

do $$
begin
  if not exists (select 1 from pg_constraint where conname='students_group_id_fkey') then
    alter table public.students
      add constraint students_group_id_fkey
      foreign key (group_id) references public.student_groups(id) on delete set null;
  end if;
end $$;

create table if not exists public.event_students (
  event_id uuid not null references public.events(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  primary key (event_id,student_id)
);
create index if not exists event_students_student_idx on public.event_students(student_id);

alter table public.student_groups enable row level security;
alter table public.event_students enable row level security;


alter table public.students drop constraint if exists students_age_range_check;
alter table public.students add constraint students_age_range_check check (age is null or (age between 0 and 120));
