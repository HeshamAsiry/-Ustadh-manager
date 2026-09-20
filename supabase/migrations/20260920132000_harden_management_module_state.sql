create or replace function public.set_management_module(
  p_kind text,
  p_rows jsonb
)
returns jsonb
language plpgsql
set search_path = public, pg_catalog
as $function$
declare
  result jsonb;
begin
  if p_kind not in ('payments','exams','paths','reports','alerts','settings','my-calendar') then
    raise exception 'Unsupported management module: %', p_kind;
  end if;

  update public.user_data
  set management_modules = jsonb_set(
    coalesce(management_modules,'{}'::jsonb),
    array[p_kind],
    coalesce(p_rows,'[]'::jsonb),
    true
  ),
  updated_at = now()
  where user_id = auth.uid()
  returning management_modules into result;

  if result is null then
    raise exception 'USER_DATA_NOT_FOUND';
  end if;

  return result;
end;
$function$;

grant execute on function public.set_management_module(text,jsonb) to authenticated;

drop index if exists public.student_groups_teacher_name_uidx;
