-- Keep recurring schedules and generated events consistent.

begin;

with ranked_events as (
  select id,
         row_number() over (
           partition by teacher_id, student_id, starts_at
           order by case when status = 'completed' then 0 else 1 end, created_at asc, id asc
         ) as rn
  from events
  where recurring_schedule_id is not null
)
delete from events e
using ranked_events r
where e.id = r.id and r.rn > 1;

with ranked_schedules as (
  select id,
         first_value(id) over (
           partition by teacher_id, student_id, weekday, start_time, timezone
           order by created_at asc, id asc
         ) as keep_id,
         row_number() over (
           partition by teacher_id, student_id, weekday, start_time, timezone
           order by created_at asc, id asc
         ) as rn
  from recurring_schedules
  where status = 'active'
)
update events e
set recurring_schedule_id = r.keep_id
from ranked_schedules r
where e.recurring_schedule_id = r.id and r.rn > 1;

with ranked_schedules as (
  select id,
         row_number() over (
           partition by teacher_id, student_id, weekday, start_time, timezone
           order by created_at asc, id asc
         ) as rn
  from recurring_schedules
  where status = 'active'
)
delete from recurring_schedules s
using ranked_schedules r
where s.id = r.id and r.rn > 1;

create unique index if not exists recurring_active_unique_idx
on recurring_schedules (
  teacher_id,
  coalesce(student_id, '00000000-0000-0000-0000-000000000000'::uuid),
  weekday,
  start_time,
  timezone
)
where status = 'active';

create or replace function prevent_recurring_event_delete()
returns trigger
language plpgsql
as $$
begin
  if old.recurring_schedule_id is not null then
    update events set status = 'cancelled', updated_at = now() where id = old.id;
    return null;
  end if;
  return old;
end;
$$;

drop trigger if exists trg_preserve_recurring_event on events;
create trigger trg_preserve_recurring_event
before delete on events
for each row
execute function prevent_recurring_event_delete();

commit;
