-- BHARATEE BUSINESS PLATFORM
-- Migration 003: role-checked accounting dashboard summary.
-- Run once in Supabase SQL Editor after 001_initial_schema.sql.
-- SECURITY INVOKER means the caller's RLS policies remain in force.

create or replace function public.get_accounting_dashboard(
  p_business_id uuid,
  p_period_start timestamptz,
  p_period_end timestamptz
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_role text;
  v_receipts numeric(14,2) := 0;
  v_refunds numeric(14,2) := 0;
  v_expenses numeric(14,2) := 0;
  v_receipts_by_method jsonb := '{}'::jsonb;
  v_refunds_by_method jsonb := '{}'::jsonb;
  v_expenses_by_method jsonb := '{}'::jsonb;
  v_pending_amount numeric(14,2) := 0;
  v_pending_orders bigint := 0;
  v_customers bigint := 0;
  v_open_orders bigint := 0;
  v_new_enquiries bigint := 0;
  v_upcoming_bookings bigint := 0;
  v_orders_today numeric(14,2) := 0;
  v_cash_session jsonb := null;
  v_cash_expected numeric(14,2) := 0;
  v_session_id uuid := null;
  v_session_opening numeric(14,2) := 0;
  v_session_opened_at timestamptz := null;
  v_cash_receipts numeric(14,2) := 0;
  v_cash_refunds numeric(14,2) := 0;
  v_cash_expenses numeric(14,2) := 0;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_business_id is null or p_period_start is null or p_period_end is null
     or p_period_end <= p_period_start then
    raise exception 'A valid business and reporting period are required'
      using errcode = '22023';
  end if;

  select bm.role
    into v_role
  from public.business_members bm
  where bm.user_id = auth.uid()
    and bm.business_id = p_business_id
    and bm.is_active = true;

  if v_role is null then
    raise exception 'You do not have access to this business'
      using errcode = '42501';
  end if;

  if v_role not in ('owner', 'admin', 'manager', 'accountant') then
    raise exception 'Financial dashboard access is not allowed for your role'
      using errcode = '42501';
  end if;

  select count(*)
    into v_customers
  from public.customer_business_links cbl
  where cbl.business_id = p_business_id;

  select count(*)
    into v_open_orders
  from public.orders o
  where o.business_id = p_business_id
    and o.status in ('received', 'in_progress', 'ready', 'on_hold');

  select count(*)
    into v_new_enquiries
  from public.enquiries e
  where e.business_id = p_business_id
    and e.status = 'new';

  select count(*)
    into v_upcoming_bookings
  from public.studio_bookings sb
  where sb.business_id = p_business_id
    and sb.starts_at >= now()
    and sb.starts_at < now() + interval '30 days'
    and sb.status not in ('cancelled', 'delivered', 'completed');

  select coalesce(sum(o.total), 0)
    into v_orders_today
  from public.orders o
  where o.business_id = p_business_id
    and o.created_at >= date_trunc('day', now())
    and o.created_at < date_trunc('day', now()) + interval '1 day'
    and o.status <> 'cancelled';

  select
    coalesce(sum(pt.amount) filter (where pt.entry_type = 'receipt'), 0),
    coalesce(sum(pt.amount) filter (where pt.entry_type = 'refund'), 0),
    coalesce(jsonb_object_agg(method_name, method_values), '{}'::jsonb)
  into v_receipts, v_refunds, v_receipts_by_method
  from (
    select
      pt.payment_method as method_name,
      jsonb_build_object(
        'receipts', coalesce(sum(pt.amount) filter (where pt.entry_type = 'receipt'), 0),
        'refunds', coalesce(sum(pt.amount) filter (where pt.entry_type = 'refund'), 0),
        'net', coalesce(sum(pt.amount) filter (where pt.entry_type = 'receipt'), 0)
             - coalesce(sum(pt.amount) filter (where pt.entry_type = 'refund'), 0)
      ) as method_values
    from public.payment_transactions pt
    where pt.business_id = p_business_id
      and pt.transaction_at >= p_period_start
      and pt.transaction_at < p_period_end
    group by pt.payment_method
  ) methods
  cross join lateral (
    select
      coalesce(sum(pt.amount) filter (where pt.entry_type = 'receipt'), 0) as receipts,
      coalesce(sum(pt.amount) filter (where pt.entry_type = 'refund'), 0) as refunds
    from public.payment_transactions pt
    where pt.business_id = p_business_id
      and pt.transaction_at >= p_period_start
      and pt.transaction_at < p_period_end
  ) totals;

  select coalesce(jsonb_object_agg(method_name, method_total), '{}'::jsonb),
         coalesce(sum(method_total), 0)
    into v_expenses_by_method, v_expenses
  from (
    select e.payment_method as method_name, sum(e.amount) as method_total
    from public.expenses e
    where e.business_id = p_business_id
      and e.expense_date >= p_period_start
      and e.expense_date < p_period_end
    group by e.payment_method
  ) expense_methods;

  with per_order_payments as (
    select pt.order_id,
           sum(case when pt.entry_type = 'receipt' then pt.amount else -pt.amount end) as paid
    from public.payment_transactions pt
    where pt.business_id = p_business_id
    group by pt.order_id
  ),
  balances as (
    select o.id,
           greatest(o.total - coalesce(pop.paid, 0), 0) as balance
    from public.orders o
    left join per_order_payments pop on pop.order_id = o.id
    where o.business_id = p_business_id
      and o.status <> 'cancelled'
  )
  select coalesce(sum(balance), 0),
         count(*) filter (where balance > 0)
    into v_pending_amount, v_pending_orders
  from balances;

  select cs.id, cs.opening_cash, cs.opened_at
    into v_session_id, v_session_opening, v_session_opened_at
  from public.cash_sessions cs
  where cs.business_id = p_business_id
    and cs.closed_at is null
  order by cs.opened_at desc
  limit 1;

  if v_session_id is not null then
    select
      coalesce(sum(pt.amount) filter (where pt.entry_type = 'receipt'), 0),
      coalesce(sum(pt.amount) filter (where pt.entry_type = 'refund'), 0)
      into v_cash_receipts, v_cash_refunds
    from public.payment_transactions pt
    where pt.business_id = p_business_id
      and pt.payment_method = 'cash'
      and pt.transaction_at >= v_session_opened_at;

    select coalesce(sum(e.amount), 0)
      into v_cash_expenses
    from public.expenses e
    where e.business_id = p_business_id
      and e.payment_method = 'cash'
      and e.expense_date >= v_session_opened_at;

    v_cash_expected := v_session_opening
                       + v_cash_receipts
                       - v_cash_refunds
                       - v_cash_expenses;

    v_cash_session := jsonb_build_object(
      'id', v_session_id,
      'opened_at', v_session_opened_at,
      'opening_cash', v_session_opening,
      'cash_receipts', v_cash_receipts,
      'cash_refunds', v_cash_refunds,
      'cash_expenses', v_cash_expenses,
      'expected_cash', v_cash_expected
    );
  end if;

  return jsonb_build_object(
    'business_id', p_business_id,
    'period_start', p_period_start,
    'period_end', p_period_end,
    'currency', 'INR',
    'role', v_role,
    'customers', v_customers,
    'open_orders', v_open_orders,
    'new_enquiries', v_new_enquiries,
    'upcoming_bookings_30d', v_upcoming_bookings,
    'orders_created_today_total', v_orders_today,
    'gross_receipts', v_receipts,
    'refunds', v_refunds,
    'net_collections', v_receipts - v_refunds,
    'collections_by_method', v_receipts_by_method,
    'expenses_total', v_expenses,
    'expenses_by_method', v_expenses_by_method,
    'operating_cash_movement', v_receipts - v_refunds - v_expenses,
    'pending_customer_balance', v_pending_amount,
    'orders_with_pending_balance', v_pending_orders,
    'cash_session', v_cash_session
  );
end;
$$;

revoke all on function public.get_accounting_dashboard(uuid, timestamptz, timestamptz)
  from public, anon;
grant execute on function public.get_accounting_dashboard(uuid, timestamptz, timestamptz)
  to authenticated;

-- Supporting indexes for method-wise finance and open balances.
create index if not exists idx_payment_business_method_period
  on public.payment_transactions(business_id, payment_method, transaction_at desc);
create index if not exists idx_expense_business_method_period
  on public.expenses(business_id, payment_method, expense_date desc);
create index if not exists idx_cash_sessions_open
  on public.cash_sessions(business_id, opened_at desc)
  where closed_at is null;

-- Verification:
-- select public.get_accounting_dashboard(
--   '<business-uuid>'::uuid,
--   date_trunc('month', now()),
--   date_trunc('month', now()) + interval '1 month'
-- );
