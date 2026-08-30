alter table public.students
  add column if not exists age integer;

alter table public.students
  add constraint students_age_range check (age is null or age between 1 and 100);
