alter table public.user_data
  add column if not exists management_modules jsonb not null default '{}'::jsonb;
