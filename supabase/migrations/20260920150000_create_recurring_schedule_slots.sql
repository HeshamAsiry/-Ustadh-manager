create table if not exists public.recurring_schedule_slots (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null check (source_type in ('lesson','personal')),
  legacy_id text,
  title text not null,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  duration_minutes integer not null check (duration_minutes between 1 and 1440),
  timezone text not null default 'Africa/Cairo',
  active boolean not null default true,
  reminder_minutes integer not null default 30 check (reminder_minutes >= 0),
  location_or_platform text null,
  notes text null,
  group_id uuid null references public.student_groups(id) on delete set null,
  recurrence_type text not null default 'weekly' check (recurrence_type = 'weekly'),
  legacy_data jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (teacher_id, source_type, legacy_id, day_of_week)
);

create table if not exists public.recurring_slot_students (
  recurring_slot_id uuid not null references public.recurring_schedule_slots(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  primary key (recurring_slot_id, student_id)
);

create index if not exists recurring_schedule_teacher_day_idx
  on public.recurring_schedule_slots(teacher_id, day_of_week, start_time);
create index if not exists recurring_slot_students_student_idx
  on public.recurring_slot_students(student_id);

alter table public.recurring_schedule_slots enable row level security;
alter table public.recurring_slot_students enable row level security;

drop policy if exists "recurring_schedule_select_own" on public.recurring_schedule_slots;
drop policy if exists "recurring_schedule_insert_own" on public.recurring_schedule_slots;
drop policy if exists "recurring_schedule_update_own" on public.recurring_schedule_slots;
drop policy if exists "recurring_schedule_delete_own" on public.recurring_schedule_slots;
create policy "recurring_schedule_select_own" on public.recurring_schedule_slots for select to authenticated
using ((select auth.uid()) = teacher_id);
create policy "recurring_schedule_insert_own" on public.recurring_schedule_slots for insert to authenticated
with check ((select auth.uid()) = teacher_id);
create policy "recurring_schedule_update_own" on public.recurring_schedule_slots for update to authenticated
using ((select auth.uid()) = teacher_id)
with check ((select auth.uid()) = teacher_id);
create policy "recurring_schedule_delete_own" on public.recurring_schedule_slots for delete to authenticated
using ((select auth.uid()) = teacher_id);

drop policy if exists "recurring_slot_students_select_own" on public.recurring_slot_students;
drop policy if exists "recurring_slot_students_insert_own" on public.recurring_slot_students;
drop policy if exists "recurring_slot_students_update_own" on public.recurring_slot_students;
drop policy if exists "recurring_slot_students_delete_own" on public.recurring_slot_students;
create policy "recurring_slot_students_select_own" on public.recurring_slot_students for select to authenticated
using (exists (
  select 1 from public.recurring_schedule_slots r
  where r.id = recurring_slot_id and r.teacher_id = (select auth.uid())
));
create policy "recurring_slot_students_insert_own" on public.recurring_slot_students for insert to authenticated
with check (
  exists (select 1 from public.recurring_schedule_slots r where r.id = recurring_slot_id and r.teacher_id = (select auth.uid()))
  and exists (select 1 from public.students s where s.id = student_id and s.teacher_id = (select auth.uid()))
);
create policy "recurring_slot_students_update_own" on public.recurring_slot_students for update to authenticated
using (exists (select 1 from public.recurring_schedule_slots r where r.id = recurring_slot_id and r.teacher_id = (select auth.uid())))
with check (
  exists (select 1 from public.recurring_schedule_slots r where r.id = recurring_slot_id and r.teacher_id = (select auth.uid()))
  and exists (select 1 from public.students s where s.id = student_id and s.teacher_id = (select auth.uid()))
);
create policy "recurring_slot_students_delete_own" on public.recurring_slot_students for delete to authenticated
using (exists (
  select 1 from public.recurring_schedule_slots r
  where r.id = recurring_slot_id and r.teacher_id = (select auth.uid())
));

drop trigger if exists set_recurring_schedule_updated_at on public.recurring_schedule_slots;
create trigger set_recurring_schedule_updated_at
before update on public.recurring_schedule_slots
for each row execute function public.set_updated_at();

-- Backfill the one legacy student that was not present in the first relational migration.
insert into public.students (
  teacher_id, legacy_id, legacy_data, full_name, age, country_code, country_name,
  timezone, native_language, contact_phone, compensation_type, currency_code,
  center_name, center_number, monthly_hours, status, notes
)
select
  u.user_id, x->>'id', x, coalesce(x->>'name','هانا'), null, 'BE', 'بلجيكا',
  'Europe/Brussels', x->>'nativeLanguage', x->>'phone',
  case when x->>'accountType'='center' then 'center' else 'virtual_currency' end,
  case when x->>'accountType'='center' then null else coalesce(x->>'currency','EUR') end,
  x->>'centerName', x->>'centerNumber',
  coalesce(nullif(x->>'monthlyTargetHours','')::numeric,8),
  case when x->>'status'='active' then 'active' when x->>'status'='paused' then 'paused' else 'archived' end,
  coalesce(x->>'whatWillStudy',x->>'subjectDetail',x->>'notes')
from public.user_data u
cross join lateral jsonb_array_elements(coalesce(u.students,'[]'::jsonb)) x
where x->>'id'='student-ae0fc34f-33a4-4621-b669-63d0c98a0d65'
on conflict (teacher_id, legacy_id) do update set
  full_name=excluded.full_name,
  country_code=excluded.country_code,
  country_name=excluded.country_name,
  timezone=excluded.timezone,
  native_language=excluded.native_language,
  contact_phone=excluded.contact_phone,
  compensation_type=excluded.compensation_type,
  currency_code=excluded.currency_code,
  center_name=excluded.center_name,
  center_number=excluded.center_number,
  monthly_hours=excluded.monthly_hours,
  status=excluded.status,
  notes=excluded.notes,
  legacy_data=excluded.legacy_data;

-- Backfill recurring lesson rules from the legacy weekly slots.
insert into public.recurring_schedule_slots (
  teacher_id, source_type, legacy_id, title, day_of_week, start_time, duration_minutes,
  timezone, active, reminder_minutes, recurrence_type, legacy_data
)
select
  u.user_id, 'lesson', x->>'id', coalesce(x->>'subject','حصة'),
  coalesce((x->>'dayOfWeek')::integer,0), (x->>'teacherStartTime')::time,
  coalesce((x->>'durationMinutes')::integer,60),
  coalesce(u.settings->>'teacherTimeZone',u.settings->>'timezone','Africa/Cairo'),
  coalesce((x->>'active')::boolean,true), 30, 'weekly', x
from public.user_data u
cross join lateral jsonb_array_elements(coalesce(u.recurring_slots,'[]'::jsonb)) x
where x->>'id' is not null
on conflict (teacher_id, source_type, legacy_id, day_of_week) do nothing;

insert into public.recurring_slot_students (recurring_slot_id, student_id)
select r.id, s.id
from public.user_data u
cross join lateral jsonb_array_elements(coalesce(u.recurring_slots,'[]'::jsonb)) x
join public.recurring_schedule_slots r on r.teacher_id=u.user_id and r.source_type='lesson' and r.legacy_id=x->>'id'
cross join lateral jsonb_array_elements_text(coalesce(x->'studentIds','[]'::jsonb)) sid(legacy_student_id)
join public.students s on s.teacher_id=u.user_id and s.legacy_id=sid.legacy_student_id
on conflict do nothing;

-- Backfill personal recurring schedules, one row per weekday.
insert into public.recurring_schedule_slots (
  teacher_id, source_type, legacy_id, title, day_of_week, start_time, duration_minutes,
  timezone, active, reminder_minutes, location_or_platform, notes, recurrence_type, legacy_data
)
select
  u.user_id, 'personal', p->>'id', coalesce(p->>'title','موعد شخصي'),
  (d.day_value)::integer, (p->>'startTime')::time,
  coalesce((p->>'durationMinutes')::integer,60),
  coalesce(u.settings->>'teacherTimeZone',u.settings->>'timezone','Africa/Cairo'),
  coalesce((p->>'isActive')::boolean,true),
  coalesce((p->>'reminderMinutesBefore')::integer,30),
  p->>'locationOrPlatform', nullif(p->>'notes',''), 'weekly', p
from public.user_data u
cross join lateral jsonb_array_elements(coalesce(u.personal_schedule,'[]'::jsonb)) p
cross join lateral jsonb_array_elements_text(coalesce(p->'daysOfWeek',jsonb_build_array(p->>'dayOfWeek'))) d(day_value)
where jsonb_typeof(u.personal_schedule)='array'
  and p->>'id' is not null
  and coalesce(p->>'startTime','') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
on conflict (teacher_id, source_type, legacy_id, day_of_week) do nothing;
