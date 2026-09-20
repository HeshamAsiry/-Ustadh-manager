
alter table public.student_groups enable row level security;
alter table public.event_students enable row level security;

drop policy if exists "Teachers can view own student groups" on public.student_groups;
drop policy if exists "Teachers can insert own student groups" on public.student_groups;
drop policy if exists "Teachers can update own student groups" on public.student_groups;
drop policy if exists "Teachers can delete own student groups" on public.student_groups;

create policy "Teachers can view own student groups"
on public.student_groups for select to authenticated
using ((select auth.uid())=teacher_id);

create policy "Teachers can insert own student groups"
on public.student_groups for insert to authenticated
with check ((select auth.uid())=teacher_id);

create policy "Teachers can update own student groups"
on public.student_groups for update to authenticated
using ((select auth.uid())=teacher_id)
with check ((select auth.uid())=teacher_id);

create policy "Teachers can delete own student groups"
on public.student_groups for delete to authenticated
using ((select auth.uid())=teacher_id);

drop policy if exists "Teachers can view own event participants" on public.event_students;
drop policy if exists "Teachers can insert own event participants" on public.event_students;
drop policy if exists "Teachers can update own event participants" on public.event_students;
drop policy if exists "Teachers can delete own event participants" on public.event_students;

create policy "Teachers can view own event participants"
on public.event_students for select to authenticated
using (exists (
  select 1 from public.events e
  where e.id=event_students.event_id and e.teacher_id=(select auth.uid())
));

create policy "Teachers can insert own event participants"
on public.event_students for insert to authenticated
with check (exists (
  select 1
  from public.events e
  join public.students s on s.id=event_students.student_id
  where e.id=event_students.event_id
    and e.teacher_id=(select auth.uid())
    and s.teacher_id=(select auth.uid())
));

create policy "Teachers can update own event participants"
on public.event_students for update to authenticated
using (exists (
  select 1 from public.events e
  where e.id=event_students.event_id and e.teacher_id=(select auth.uid())
))
with check (exists (
  select 1
  from public.events e
  join public.students s on s.id=event_students.student_id
  where e.id=event_students.event_id
    and e.teacher_id=(select auth.uid())
    and s.teacher_id=(select auth.uid())
));

create policy "Teachers can delete own event participants"
on public.event_students for delete to authenticated
using (exists (
  select 1 from public.events e
  where e.id=event_students.event_id and e.teacher_id=(select auth.uid())
));
