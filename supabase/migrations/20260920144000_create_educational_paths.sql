create table if not exists public.educational_paths (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  legacy_id text null,
  title text not null,
  description text null,
  category text null,
  stage_name text null,
  author_or_source text null,
  color text null,
  total_units_or_pages integer not null default 0 check (total_units_or_pages >= 0),
  status text not null default 'active' check (status in ('active','archived')),
  legacy_data jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(teacher_id,legacy_id)
);

create table if not exists public.educational_path_stages (
  id uuid primary key default gen_random_uuid(),
  path_id uuid not null references public.educational_paths(id) on delete cascade,
  legacy_id text null,
  name text not null,
  description text null,
  total_units_or_lessons integer not null default 0 check (total_units_or_lessons >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(path_id,legacy_id)
);

create index if not exists educational_paths_teacher_idx on public.educational_paths(teacher_id,status);
create index if not exists educational_path_stages_path_idx on public.educational_path_stages(path_id,sort_order);

alter table public.educational_paths enable row level security;
alter table public.educational_path_stages enable row level security;

drop policy if exists "educational_paths_select_own" on public.educational_paths;
drop policy if exists "educational_paths_insert_own" on public.educational_paths;
drop policy if exists "educational_paths_update_own" on public.educational_paths;
drop policy if exists "educational_paths_delete_own" on public.educational_paths;
create policy "educational_paths_select_own" on public.educational_paths for select to authenticated using ((select auth.uid())=teacher_id);
create policy "educational_paths_insert_own" on public.educational_paths for insert to authenticated with check ((select auth.uid())=teacher_id);
create policy "educational_paths_update_own" on public.educational_paths for update to authenticated using ((select auth.uid())=teacher_id) with check ((select auth.uid())=teacher_id);
create policy "educational_paths_delete_own" on public.educational_paths for delete to authenticated using ((select auth.uid())=teacher_id);

drop policy if exists "educational_path_stages_select_own" on public.educational_path_stages;
drop policy if exists "educational_path_stages_insert_own" on public.educational_path_stages;
drop policy if exists "educational_path_stages_update_own" on public.educational_path_stages;
drop policy if exists "educational_path_stages_delete_own" on public.educational_path_stages;
create policy "educational_path_stages_select_own" on public.educational_path_stages for select to authenticated using (exists(select 1 from public.educational_paths p where p.id=path_id and p.teacher_id=(select auth.uid())));
create policy "educational_path_stages_insert_own" on public.educational_path_stages for insert to authenticated with check (exists(select 1 from public.educational_paths p where p.id=path_id and p.teacher_id=(select auth.uid())));
create policy "educational_path_stages_update_own" on public.educational_path_stages for update to authenticated using (exists(select 1 from public.educational_paths p where p.id=path_id and p.teacher_id=(select auth.uid()))) with check (exists(select 1 from public.educational_paths p where p.id=path_id and p.teacher_id=(select auth.uid())));
create policy "educational_path_stages_delete_own" on public.educational_path_stages for delete to authenticated using (exists(select 1 from public.educational_paths p where p.id=path_id and p.teacher_id=(select auth.uid())));

drop trigger if exists set_educational_paths_updated_at on public.educational_paths;
create trigger set_educational_paths_updated_at before update on public.educational_paths for each row execute function public.set_updated_at();
drop trigger if exists set_educational_path_stages_updated_at on public.educational_path_stages;
create trigger set_educational_path_stages_updated_at before update on public.educational_path_stages for each row execute function public.set_updated_at();

insert into public.educational_paths (teacher_id,legacy_id,title,description,category,stage_name,author_or_source,color,total_units_or_pages,status,legacy_data)
select u.user_id,c->>'id',c->>'title',c->>'description',c->>'category',c->>'stageName',c->>'authorOrSource',c->>'color',
       coalesce(nullif(c->>'totalUnitsOrPages','')::integer,0),'active',c
from public.user_data u
cross join lateral jsonb_array_elements(coalesce(u.curricula,'[]'::jsonb)) c
where not exists (
  select 1 from public.educational_paths ep
  where ep.teacher_id=u.user_id and ep.legacy_id=c->>'id'
);

insert into public.educational_path_stages (path_id,legacy_id,name,description,total_units_or_lessons,sort_order)
select ep.id,s->>'id',s->>'name',s->>'description',
       coalesce(nullif(s->>'totalUnitsOrLessons','')::integer,0),row_number() over(partition by ep.id order by ord)-1
from public.user_data u
cross join lateral jsonb_array_elements(coalesce(u.curricula,'[]'::jsonb)) c
join public.educational_paths ep on ep.teacher_id=u.user_id and ep.legacy_id=c->>'id'
cross join lateral jsonb_array_elements(coalesce(c->'stages','[]'::jsonb)) with ordinality as z(s,ord)
where not exists (
  select 1 from public.educational_path_stages eps
  where eps.path_id=ep.id and eps.legacy_id=s->>'id'
);