create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid null references public.students(id) on delete set null,
  student_name text not null,
  legacy_student_id text null,
  billing_period text null,
  month_year text null,
  hourly_rate numeric(12,2) not null default 0 check (hourly_rate >= 0),
  agreed_hours numeric(8,2) not null default 0 check (agreed_hours >= 0),
  actual_hours numeric(8,2) not null default 0 check (actual_hours >= 0),
  total_hours_billed numeric(8,2) not null default 0 check (total_hours_billed >= 0),
  amount numeric(12,2) not null default 0 check (amount >= 0),
  amount_paid numeric(12,2) not null default 0 check (amount_paid >= 0),
  total_due numeric(12,2) not null default 0 check (total_due >= 0),
  currency_code text not null default 'USD',
  status text not null default 'unpaid' check (status in ('paid','partial','unpaid')),
  payment_method text null,
  payment_date date null,
  due_date date null,
  notes text null,
  legacy_data jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (amount_paid <= amount or amount = 0),
  check (abs(total_due-greatest(0,amount-amount_paid))<=0.01)
);

create index if not exists payments_teacher_period_idx on public.payments(teacher_id, month_year);
create index if not exists payments_teacher_student_idx on public.payments(teacher_id, student_id);
create index if not exists payments_student_idx on public.payments(student_id);

alter table public.payments enable row level security;

drop policy if exists "payments_select_own" on public.payments;
drop policy if exists "payments_insert_own" on public.payments;
drop policy if exists "payments_update_own" on public.payments;
drop policy if exists "payments_delete_own" on public.payments;

create policy "payments_select_own"
on public.payments for select to authenticated
using ((select auth.uid()) = teacher_id);

create policy "payments_insert_own"
on public.payments for insert to authenticated
with check ((select auth.uid()) = teacher_id);

create policy "payments_update_own"
on public.payments for update to authenticated
using ((select auth.uid()) = teacher_id)
with check ((select auth.uid()) = teacher_id);

create policy "payments_delete_own"
on public.payments for delete to authenticated
using ((select auth.uid()) = teacher_id);

insert into public.payments (
  teacher_id, student_id, student_name, legacy_student_id, billing_period, month_year,
  hourly_rate, agreed_hours, actual_hours, total_hours_billed,
  amount, amount_paid, total_due, currency_code, status, payment_method,
  payment_date, due_date, notes, legacy_data
)
select
  u.user_id,
  s.id,
  coalesce(p->>'studentName','طالب'),
  p->>'studentId',
  p->>'billingPeriod',
  p->>'monthYear',
  coalesce(nullif(p->>'hourlyRate','')::numeric,0),
  coalesce(nullif(p->>'agreedHours','')::numeric,0),
  coalesce(nullif(p->>'actualHours','')::numeric,0),
  coalesce(nullif(p->>'totalHoursBilled','')::numeric,0),
  coalesce(nullif(p->>'amount','')::numeric,0),
  least(
    coalesce(nullif(p->>'amountPaid','')::numeric,0),
    coalesce(nullif(p->>'amount','')::numeric,0)
  ),
  coalesce(nullif(p->>'totalDue','')::numeric,0),
  coalesce(nullif(p->>'currency',''),'USD'),
  case p->>'status' when 'paid' then 'paid' when 'partial' then 'partial' else 'unpaid' end,
  nullif(p->>'paymentMethod',''),
  case when coalesce(p->>'paymentDate','') ~ '^\\d{4}-\\d{2}-\\d{2}$' then (p->>'paymentDate')::date end,
  case when coalesce(p->>'dueDate','') ~ '^\\d{4}-\\d{2}-\\d{2}$' then (p->>'dueDate')::date end,
  nullif(p->>'notes',''),
  p
from public.user_data u
cross join lateral jsonb_array_elements(coalesce(u.payments,'[]'::jsonb)) p
left join public.students s
  on s.teacher_id=u.user_id and s.legacy_id=p->>'studentId'
where not exists (
  select 1
  from public.payments x
  where x.teacher_id=u.user_id
    and coalesce(x.legacy_student_id,'')=coalesce(p->>'studentId','')
    and coalesce(x.month_year,'')=coalesce(p->>'monthYear','')
    and x.amount=coalesce(nullif(p->>'amount','')::numeric,0)
    and x.amount_paid=least(
      coalesce(nullif(p->>'amountPaid','')::numeric,0),
      coalesce(nullif(p->>'amount','')::numeric,0)
    )
);

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();
