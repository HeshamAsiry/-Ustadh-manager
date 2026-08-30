-- Ustadh Manager database schema
create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  locale text not null default 'ar' check (locale in ('ar','fr','en')),
  timezone text not null default 'Africa/Cairo',
  created_at timestamptz not null default now()
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  full_name text not null,
  birth_date date,
  country text,
  timezone text,
  parent_name text,
  parent_email text,
  parent_phone text,
  monthly_hours numeric(6,2) not null default 0,
  status text not null default 'active' check (status in ('active','paused','archived','waiting')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_fr text not null,
  name_en text not null,
  unique(name_ar)
);

create table if not exists student_subjects (
  student_id uuid references students(id) on delete cascade,
  subject_id uuid references subjects(id) on delete cascade,
  primary key(student_id, subject_id)
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  student_id uuid references students(id) on delete set null,
  title text not null,
  event_type text not null default 'lesson' check (event_type in ('lesson','personal','makeup','exam','task','other')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled','pending_makeup')),
  original_event_id uuid references events(id) on delete set null,
  reminder_minutes integer default 30,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists lesson_report_items (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null,
  subject_id uuid references subjects(id) on delete set null,
  section text not null check (section in ('studied','revision','homework','next','private_note')),
  content text not null
);

create table if not exists lesson_reports (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references events(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  teacher_id uuid not null references profiles(id) on delete cascade,
  report_ar text,
  report_fr text,
  report_en text,
  created_at timestamptz not null default now()
);

create table if not exists learning_paths (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  curriculum_name text not null,
  stage_name text,
  progress numeric(5,2) not null default 0 check(progress between 0 and 100),
  notes text
);

create table if not exists curricula (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text
);

create table if not exists quran_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  surah_number integer not null,
  from_ayah integer,
  to_ayah integer,
  progress_type text not null check(progress_type in ('memorization','revision')),
  status text not null default 'in_progress' check(status in ('in_progress','completed')),
  mastery numeric(5,2) default 0 check(mastery between 0 and 100),
  completed_at timestamptz
);

create table if not exists exams (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  title text not null,
  exam_type text not null,
  scheduled_at timestamptz,
  score numeric(5,2),
  notes text,
  status text not null default 'planned' check(status in ('planned','completed','cancelled'))
);

create table if not exists homework (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  event_id uuid references events(id) on delete set null,
  content text not null,
  due_at timestamptz,
  completed boolean not null default false
);

create table if not exists availability_rules (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  weekday integer not null check(weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  active boolean not null default true,
  check(end_time > start_time)
);

create table if not exists availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  exception_date date not null,
  available boolean not null default false,
  start_time time,
  end_time time,
  reason text
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  amount numeric(10,2) not null,
  paid_at timestamptz,
  period_month date,
  status text not null default 'pending' check(status in ('pending','paid','partial','cancelled')),
  notes text
);

create index if not exists idx_students_teacher on students(teacher_id);
create index if not exists idx_events_teacher_start on events(teacher_id, starts_at);
create index if not exists idx_events_student_start on events(student_id, starts_at);
create index if not exists idx_reports_student on lesson_reports(student_id, created_at desc);
create index if not exists idx_quran_student on quran_progress(student_id);

alter table profiles enable row level security;
alter table students enable row level security;
alter table student_subjects enable row level security;
alter table events enable row level security;
alter table lesson_reports enable row level security;
alter table lesson_report_items enable row level security;
alter table learning_paths enable row level security;
alter table quran_progress enable row level security;
alter table exams enable row level security;
alter table homework enable row level security;
alter table availability_rules enable row level security;
alter table availability_exceptions enable row level security;
alter table payments enable row level security;

-- Basic owner policies; app access is scoped to the signed-in teacher.
do $$ begin
  create policy profile_self on profiles for all using (id = auth.uid()) with check (id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy students_owner on students for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy events_owner on events for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy reports_owner on lesson_reports for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy paths_owner on learning_paths for all using (student_id in (select id from students where teacher_id = auth.uid())) with check (student_id in (select id from students where teacher_id = auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy quran_owner on quran_progress for all using (student_id in (select id from students where teacher_id = auth.uid())) with check (student_id in (select id from students where teacher_id = auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy exams_owner on exams for all using (student_id in (select id from students where teacher_id = auth.uid())) with check (student_id in (select id from students where teacher_id = auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy homework_owner on homework for all using (student_id in (select id from students where teacher_id = auth.uid())) with check (student_id in (select id from students where teacher_id = auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy availability_owner on availability_rules for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy exceptions_owner on availability_exceptions for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy payments_owner on payments for all using (student_id in (select id from students where teacher_id = auth.uid())) with check (student_id in (select id from students where teacher_id = auth.uid()));
exception when duplicate_object then null; end $$;
