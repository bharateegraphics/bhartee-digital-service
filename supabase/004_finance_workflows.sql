-- BHARATEE BUSINESS PLATFORM
-- Migration 004: secure finance entry and cashbook workflows.
-- Run ONCE in Supabase SQL Editor after migrations 001 and 003.
-- Creates RPCs for new sales, existing-order receipts/refunds, expenses,
-- cashbook opening/closing, and fixes the dashboard aggregate logic.

create extension if not exists pgcrypto;

-- One open cash session per business. Existing duplicates, if any, must be
-- reconciled manually before this index can be created.
create unique index if not exists cash_sessions_one_open_per_business
  on public.cash_sessions(business_id)
  where closed_at is null;

-- Seed common expense categories for both businesses (idempotent).
insert into public.expense_categories (business_id, name_i18n)
select b.id, c.name_i18n
from public.business_units b
cross join (values
  ('{"en":"Shop Rent","hi":"दुकान का किराया","or":"ଦୋକାନ ଭଡ଼ା"}'::jsonb),
  ('{"en":"Electricity","hi":"बिजली","or":"ବିଦ୍ୟୁତ୍"}'::jsonb),
  ('{"en":"Internet & Phone","hi":"इंटरनेट और फोन","or":"ଇଣ୍ଟରନେଟ୍ ଓ ଫୋନ୍"}'::jsonb),
  ('{"en":"Printing Materials","hi":"प्रिंटिंग सामग्री","or":"ପ୍ରିଣ୍ଟିଂ ସାମଗ୍ରୀ"}'::jsonb),
  ('{"en":"Photo Paper & Ink","hi":"फोटो पेपर और इंक","or":"ଫଟୋ ପେପର୍ ଓ ଇଙ୍କ୍"}'::jsonb),
  ('{"en":"Equipment & Repairs","hi":"उपकरण और मरम्मत","or":"ଉପକରଣ ଓ ମରାମତି"}'::jsonb),
  ('{"en":"Travel & Transport","hi":"यात्रा और परिवहन","or":"ଯାତ୍ରା ଓ ପରିବହନ"}'::jsonb),
  ('{"en":"Staff Salary","hi":"स्टाफ वेतन","or":"କର୍ମଚାରୀ ଦରମା"}'::jsonb),
  ('{"en":"Marketing","hi":"मार्केटिंग","or":"ମାର୍କେଟିଂ"}'::jsonb),
  ('{"en":"Other","hi":"अन्य","or":"ଅନ୍ୟାନ୍ୟ"}'::jsonb)
) as c(name_i18n)
where b.code in ('digital-service', 'graphix')
on conflict (business_id, name_i18n) do nothing;

-- ---------------------------------------------------------------------------
-- Shared validation helper: caller must be an active finance member.
-- ---------------------------------------------------------------------------
create or replace function public.assert_finance_access(p_business_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_role text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select bm.role into v_role
  from public.business_members bm
  where bm.user_id = auth.uid()
    and bm.business_id = p_business_id
    and bm.is_active = true;

  if v_role is null then
    raise exception 'You do not have active access to this business' using errcode = '42501';
  end if;

  if v_role not in ('owner', 'admin', 'manager', 'accountant') then
    raise exception 'Finance access is limited to Owner, Admin, Manager and Accountant roles' using errcode = '42501';
  end if;

  return v_role;
end;
$$;
revoke all on function public.assert_finance_access(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Quick income: create a simple order + line item + receipt atomically.
-- Use for walk-in counter sales and one-off studio sales.
-- ---------------------------------------------------------------------------
create or replace function public.create_quick_income(
  p_business_id uuid,
  p_description text,
  p_amount numeric,
  p_payment_method text,
  p_order_type text default 'other',
  p_customer_name text default null,
  p_customer_phone text default null,
  p_reference_no text default null,
  p_transaction_at timestamptz default now(),
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role text;
  v_business_code text;
  v_customer_id uuid;
  v_order_id uuid;
  v_order_no text;
  v_payment_id uuid;
begin
  v_role := public.assert_finance_access(p_business_id);

  if p_description is null or length(btrim(p_description)) < 2 then
    raise exception 'Please enter a sale description' using errcode = '22023';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount > 99999999 then
    raise exception 'Enter a valid amount greater than zero' using errcode = '22023';
  end if;
  if p_payment_method is null or p_payment_method not in ('cash','upi','bank_transfer','card','other') then
    raise exception 'Invalid payment method' using errcode = '22023';
  end if;
  if p_order_type is null or p_order_type not in ('counter','printing','photocopy','scan','lamination','passport_photo','photo_frame','photo_editing','photography','videography','wedding','other') then
    raise exception 'Invalid order type' using errcode = '22023';
  end if;
  if p_transaction_at is null then
    raise exception 'Transaction date is required' using errcode = '22023';
  end if;

  select code into v_business_code
  from public.business_units
  where id = p_business_id and is_active = true;
  if v_business_code is null then
    raise exception 'Business unit not found or inactive' using errcode = '22023';
  end if;

  if nullif(btrim(coalesce(p_customer_name,'')), '') is not null then
    insert into public.customers(full_name, phone, created_by)
    values (btrim(p_customer_name), nullif(btrim(coalesce(p_customer_phone,'')), ''), auth.uid())
    returning id into v_customer_id;

    insert into public.customer_business_links(customer_id, business_id, created_by)
    values (v_customer_id, p_business_id, auth.uid());
  end if;

  v_order_no := format('%s-%s-%s',
    case when v_business_code = 'graphix' then 'BGX' else 'BDS' end,
    to_char(p_transaction_at at time zone 'Asia/Kolkata', 'YYYYMMDD'),
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
  );

  insert into public.orders(
    business_id, customer_id, order_no, order_type, status,
    subtotal, discount, total, notes, created_by
  ) values (
    p_business_id, v_customer_id, v_order_no, p_order_type, 'delivered',
    p_amount, 0, p_amount, nullif(btrim(coalesce(p_note,'')), ''), auth.uid()
  ) returning id into v_order_id;

  insert into public.order_items(order_id, description, quantity, unit_price)
  values (v_order_id, btrim(p_description), 1, p_amount);

  insert into public.payment_transactions(
    business_id, order_id, entry_type, amount, payment_method,
    reference_no, transaction_at, note, recorded_by
  ) values (
    p_business_id, v_order_id, 'receipt', p_amount, p_payment_method,
    nullif(btrim(coalesce(p_reference_no,'')), ''), p_transaction_at,
    nullif(btrim(coalesce(p_note,'')), ''), auth.uid()
  ) returning id into v_payment_id;

  insert into public.activity_logs(business_id, actor_id, action, entity_type, entity_id, metadata)
  values (p_business_id, auth.uid(), 'quick_income_created', 'order', v_order_id::text,
    jsonb_build_object('order_no', v_order_no, 'amount', p_amount, 'payment_method', p_payment_method));

  return jsonb_build_object('order_id', v_order_id, 'order_no', v_order_no,
    'payment_id', v_payment_id, 'customer_id', v_customer_id, 'amount', p_amount);
end;
$$;
revoke all on function public.create_quick_income(uuid,text,numeric,text,text,text,text,text,timestamptz,text) from public, anon;
grant execute on function public.create_quick_income(uuid,text,numeric,text,text,text,text,text,timestamptz,text) to authenticated;

-- ---------------------------------------------------------------------------
-- Record a receipt against an existing order, without over-collecting.
-- ---------------------------------------------------------------------------
create or replace function public.record_order_receipt(
  p_business_id uuid,
  p_order_id uuid,
  p_amount numeric,
  p_payment_method text,
  p_reference_no text default null,
  p_transaction_at timestamptz default now(),
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_total numeric(12,2);
  v_status text;
  v_paid numeric(14,2);
  v_payment_id uuid;
  v_due numeric(14,2);
begin
  perform public.assert_finance_access(p_business_id);
  if p_amount is null or p_amount <= 0 then raise exception 'Amount must be greater than zero' using errcode = '22023'; end if;
  if p_payment_method is null or p_payment_method not in ('cash','upi','bank_transfer','card','other') then raise exception 'Invalid payment method' using errcode = '22023'; end if;

  select total, status into v_total, v_status
  from public.orders where id = p_order_id and business_id = p_business_id
  for update;
  if not found then raise exception 'Order not found in this business' using errcode = 'P0002'; end if;
  if v_status = 'cancelled' then raise exception 'Cannot collect payment for a cancelled order' using errcode = '22023'; end if;

  select coalesce(sum(case when entry_type='receipt' then amount else -amount end),0)
    into v_paid from public.payment_transactions
    where business_id = p_business_id and order_id = p_order_id;
  v_due := greatest(v_total - v_paid, 0);
  if p_amount > v_due then raise exception 'Payment exceeds outstanding balance. Outstanding: %', v_due using errcode = '22023'; end if;

  insert into public.payment_transactions(business_id,order_id,entry_type,amount,payment_method,reference_no,transaction_at,note,recorded_by)
  values(p_business_id,p_order_id,'receipt',p_amount,p_payment_method,nullif(btrim(coalesce(p_reference_no,'')),''),coalesce(p_transaction_at,now()),nullif(btrim(coalesce(p_note,'')),''),auth.uid())
  returning id into v_payment_id;

  insert into public.activity_logs(business_id,actor_id,action,entity_type,entity_id,metadata)
  values(p_business_id,auth.uid(),'order_payment_received','order',p_order_id::text,jsonb_build_object('amount',p_amount,'method',p_payment_method));

  return jsonb_build_object('payment_id',v_payment_id,'order_id',p_order_id,'received',p_amount,'remaining_balance',v_due-p_amount);
end;
$$;
revoke all on function public.record_order_receipt(uuid,uuid,numeric,text,text,timestamptz,text) from public, anon;
grant execute on function public.record_order_receipt(uuid,uuid,numeric,text,text,timestamptz,text) to authenticated;

-- ---------------------------------------------------------------------------
-- Refund an order only up to the amount previously received and not refunded.
-- ---------------------------------------------------------------------------
create or replace function public.record_order_refund(
  p_business_id uuid,
  p_order_id uuid,
  p_amount numeric,
  p_payment_method text,
  p_reference_no text default null,
  p_transaction_at timestamptz default now(),
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_total numeric(12,2);
  v_status text;
  v_paid numeric(14,2);
  v_refund_id uuid;
begin
  perform public.assert_finance_access(p_business_id);
  if p_amount is null or p_amount <= 0 then raise exception 'Refund amount must be greater than zero' using errcode = '22023'; end if;
  if p_payment_method is null or p_payment_method not in ('cash','upi','bank_transfer','card','other') then raise exception 'Invalid payment method' using errcode = '22023'; end if;

  select total, status into v_total, v_status
  from public.orders where id = p_order_id and business_id = p_business_id
  for update;
  if not found then raise exception 'Order not found in this business' using errcode = 'P0002'; end if;

  select coalesce(sum(case when entry_type='receipt' then amount else -amount end),0)
    into v_paid from public.payment_transactions
    where business_id = p_business_id and order_id = p_order_id;
  if p_amount > greatest(v_paid,0) then raise exception 'Refund exceeds the net amount received: %', greatest(v_paid,0) using errcode = '22023'; end if;

  insert into public.payment_transactions(business_id,order_id,entry_type,amount,payment_method,reference_no,transaction_at,note,recorded_by)
  values(p_business_id,p_order_id,'refund',p_amount,p_payment_method,nullif(btrim(coalesce(p_reference_no,'')),''),coalesce(p_transaction_at,now()),nullif(btrim(coalesce(p_note,'')),''),auth.uid())
  returning id into v_refund_id;

  insert into public.activity_logs(business_id,actor_id,action,entity_type,entity_id,metadata)
  values(p_business_id,auth.uid(),'order_refund_recorded','order',p_order_id::text,jsonb_build_object('amount',p_amount,'method',p_payment_method));

  return jsonb_build_object('refund_id',v_refund_id,'order_id',p_order_id,'refunded',p_amount,'remaining_received_balance',v_paid-p_amount);
end;
$$;
revoke all on function public.record_order_refund(uuid,uuid,numeric,text,text,timestamptz,text) from public, anon;
grant execute on function public.record_order_refund(uuid,uuid,numeric,text,text,timestamptz,text) to authenticated;

-- ---------------------------------------------------------------------------
-- Record a business expense. Private receipt path must be scoped to the unit.
-- ---------------------------------------------------------------------------
create or replace function public.record_business_expense(
  p_business_id uuid,
  p_description text,
  p_amount numeric,
  p_payment_method text,
  p_category_id uuid default null,
  p_vendor_name text default null,
  p_expense_date timestamptz default now(),
  p_receipt_object_path text default null,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_expense_id uuid;
begin
  perform public.assert_finance_access(p_business_id);
  if p_description is null or length(btrim(p_description)) < 2 then raise exception 'Please enter an expense description' using errcode = '22023'; end if;
  if p_amount is null or p_amount <= 0 or p_amount > 99999999 then raise exception 'Enter a valid expense amount greater than zero' using errcode = '22023'; end if;
  if p_payment_method is null or p_payment_method not in ('cash','upi','bank_transfer','card','other') then raise exception 'Invalid payment method' using errcode = '22023'; end if;
  if p_category_id is not null and not exists (
    select 1 from public.expense_categories ec where ec.id=p_category_id and ec.business_id=p_business_id and ec.is_active=true
  ) then raise exception 'Expense category does not belong to this business' using errcode = '22023'; end if;
  if p_receipt_object_path is not null and left(p_receipt_object_path,length(p_business_id::text)+1) <> (p_business_id::text || '/') then
    raise exception 'Receipt path must be inside this business folder' using errcode = '22023';
  end if;

  insert into public.expenses(business_id,category_id,expense_date,description,vendor_name,amount,payment_method,receipt_object_path,note,recorded_by)
  values(p_business_id,p_category_id,coalesce(p_expense_date,now()),btrim(p_description),nullif(btrim(coalesce(p_vendor_name,'')),''),p_amount,p_payment_method,p_receipt_object_path,nullif(btrim(coalesce(p_note,'')),''),auth.uid())
  returning id into v_expense_id;

  insert into public.activity_logs(business_id,actor_id,action,entity_type,entity_id,metadata)
  values(p_business_id,auth.uid(),'business_expense_recorded','expense',v_expense_id::text,jsonb_build_object('amount',p_amount,'method',p_payment_method,'description',p_description));

  return jsonb_build_object('expense_id',v_expense_id,'amount',p_amount);
end;
$$;
revoke all on function public.record_business_expense(uuid,text,numeric,text,uuid,text,timestamptz,text,text) from public, anon;
grant execute on function public.record_business_expense(uuid,text,numeric,text,uuid,text,timestamptz,text,text) to authenticated;

-- ---------------------------------------------------------------------------
-- Open and close a single cashbook session per business.
-- ---------------------------------------------------------------------------
create or replace function public.open_cash_session(
  p_business_id uuid,
  p_opening_cash numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session_id uuid;
begin
  perform public.assert_finance_access(p_business_id);
  if p_opening_cash is null or p_opening_cash < 0 then raise exception 'Opening cash cannot be negative' using errcode = '22023'; end if;

  insert into public.cash_sessions(business_id,opened_by,opening_cash)
  values(p_business_id,auth.uid(),p_opening_cash)
  returning id into v_session_id;

  insert into public.activity_logs(business_id,actor_id,action,entity_type,entity_id,metadata)
  values(p_business_id,auth.uid(),'cash_session_opened','cash_session',v_session_id::text,jsonb_build_object('opening_cash',p_opening_cash));

  return jsonb_build_object('cash_session_id',v_session_id,'opening_cash',p_opening_cash);
exception
  when unique_violation then
    raise exception 'A cashbook session is already open for this business' using errcode = '23505';
end;
$$;
revoke all on function public.open_cash_session(uuid,numeric) from public, anon;
grant execute on function public.open_cash_session(uuid,numeric) to authenticated;

create or replace function public.close_cash_session(
  p_business_id uuid,
  p_counted_cash numeric,
  p_closing_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session public.cash_sessions%rowtype;
  v_closed_at timestamptz := now();
  v_receipts numeric(14,2) := 0;
  v_refunds numeric(14,2) := 0;
  v_expenses numeric(14,2) := 0;
  v_expected numeric(14,2) := 0;
  v_variance numeric(14,2) := 0;
begin
  perform public.assert_finance_access(p_business_id);
  if p_counted_cash is null or p_counted_cash < 0 then raise exception 'Counted cash cannot be negative' using errcode = '22023'; end if;

  select * into v_session
  from public.cash_sessions
  where business_id=p_business_id and closed_at is null
  for update;
  if not found then raise exception 'No open cashbook session exists for this business' using errcode = 'P0002'; end if;

  select
    coalesce(sum(amount) filter (where entry_type='receipt'),0),
    coalesce(sum(amount) filter (where entry_type='refund'),0)
  into v_receipts, v_refunds
  from public.payment_transactions
  where business_id=p_business_id and payment_method='cash'
    and transaction_at >= v_session.opened_at and transaction_at <= v_closed_at;

  select coalesce(sum(amount),0) into v_expenses
  from public.expenses
  where business_id=p_business_id and payment_method='cash'
    and expense_date >= v_session.opened_at and expense_date <= v_closed_at;

  v_expected := v_session.opening_cash + v_receipts - v_refunds - v_expenses;
  v_variance := p_counted_cash - v_expected;

  update public.cash_sessions
  set closed_by=auth.uid(), closed_at=v_closed_at, counted_cash=p_counted_cash,
      expected_cash=v_expected, variance=v_variance,
      closing_note=nullif(btrim(coalesce(p_closing_note,'')), '')
  where id=v_session.id;

  insert into public.activity_logs(business_id,actor_id,action,entity_type,entity_id,metadata)
  values(p_business_id,auth.uid(),'cash_session_closed','cash_session',v_session.id::text,
    jsonb_build_object('expected_cash',v_expected,'counted_cash',p_counted_cash,'variance',v_variance));

  return jsonb_build_object('cash_session_id',v_session.id,'expected_cash',v_expected,'counted_cash',p_counted_cash,'variance',v_variance);
end;
$$;
revoke all on function public.close_cash_session(uuid,numeric,text) from public, anon;
grant execute on function public.close_cash_session(uuid,numeric,text) to authenticated;

-- All monetary writes must go through the validated RPC functions above.
-- The authenticated client may read finance rows (subject to RLS), but cannot
-- insert, update or delete ledger rows directly.
revoke insert, update, delete on public.payment_transactions, public.expenses, public.cash_sessions from authenticated;
grant select on public.payment_transactions, public.expenses, public.cash_sessions to authenticated;

-- ---------------------------------------------------------------------------
-- Corrected dashboard function. Totals are queried separately from method
-- breakdowns so a zero-transaction month still returns numeric zero values.
-- ---------------------------------------------------------------------------
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
  v_expenses_by_method jsonb := '{}'::jsonb;
  v_pending_amount numeric(14,2) := 0;
  v_pending_orders bigint := 0;
  v_customers bigint := 0;
  v_open_orders bigint := 0;
  v_new_enquiries bigint := 0;
  v_upcoming_bookings bigint := 0;
  v_orders_today numeric(14,2) := 0;
  v_cash_session jsonb := null;
  v_session_id uuid := null;
  v_session_opening numeric(14,2) := 0;
  v_session_opened_at timestamptz := null;
  v_cash_receipts numeric(14,2) := 0;
  v_cash_refunds numeric(14,2) := 0;
  v_cash_expenses numeric(14,2) := 0;
  v_today_start timestamptz;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if p_business_id is null or p_period_start is null or p_period_end is null or p_period_end <= p_period_start then
    raise exception 'A valid business and reporting period are required' using errcode = '22023';
  end if;

  select bm.role into v_role
  from public.business_members bm
  where bm.user_id=auth.uid() and bm.business_id=p_business_id and bm.is_active=true;
  if v_role is null then raise exception 'You do not have access to this business' using errcode = '42501'; end if;
  if v_role not in ('owner','admin','manager','accountant') then
    raise exception 'Financial dashboard access is not allowed for your role' using errcode = '42501';
  end if;

  v_today_start := date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata';

  select count(*) into v_customers
  from public.customer_business_links cbl where cbl.business_id=p_business_id;

  select count(*) into v_open_orders
  from public.orders o where o.business_id=p_business_id and o.status in ('received','in_progress','ready','on_hold');

  if v_role in ('owner','admin','manager','cyber_staff','studio_staff') then
    select count(*) into v_new_enquiries from public.enquiries e where e.business_id=p_business_id and e.status='new';
    select count(*) into v_upcoming_bookings from public.studio_bookings sb
    where sb.business_id=p_business_id and sb.starts_at >= now() and sb.starts_at < now()+interval '30 days'
      and sb.status not in ('cancelled','delivered','completed');
  end if;

  select coalesce(sum(o.total),0) into v_orders_today
  from public.orders o where o.business_id=p_business_id
    and o.created_at>=v_today_start and o.created_at<v_today_start+interval '1 day' and o.status<>'cancelled';

  select coalesce(sum(pt.amount) filter(where pt.entry_type='receipt'),0),
         coalesce(sum(pt.amount) filter(where pt.entry_type='refund'),0)
  into v_receipts,v_refunds
  from public.payment_transactions pt
  where pt.business_id=p_business_id and pt.transaction_at>=p_period_start and pt.transaction_at<p_period_end;

  select coalesce(jsonb_object_agg(method_name,method_values),'{}'::jsonb)
  into v_receipts_by_method
  from (
    select pt.payment_method as method_name,
      jsonb_build_object(
        'receipts',coalesce(sum(pt.amount) filter(where pt.entry_type='receipt'),0),
        'refunds',coalesce(sum(pt.amount) filter(where pt.entry_type='refund'),0),
        'net',coalesce(sum(pt.amount) filter(where pt.entry_type='receipt'),0)-coalesce(sum(pt.amount) filter(where pt.entry_type='refund'),0)
      ) as method_values
    from public.payment_transactions pt
    where pt.business_id=p_business_id and pt.transaction_at>=p_period_start and pt.transaction_at<p_period_end
    group by pt.payment_method
  ) methods;

  select coalesce(sum(e.amount),0),
         coalesce(jsonb_object_agg(method_name,method_total),'{}'::jsonb)
  into v_expenses, v_expenses_by_method
  from (
    select e.payment_method as method_name, sum(e.amount) as method_total
    from public.expenses e
    where e.business_id=p_business_id and e.expense_date>=p_period_start and e.expense_date<p_period_end
    group by e.payment_method
  ) expense_methods;

  with per_order_payments as (
    select pt.order_id,sum(case when pt.entry_type='receipt' then pt.amount else -pt.amount end) as paid
    from public.payment_transactions pt where pt.business_id=p_business_id group by pt.order_id
  ), balances as (
    select greatest(o.total-coalesce(pop.paid,0),0) as balance
    from public.orders o left join per_order_payments pop on pop.order_id=o.id
    where o.business_id=p_business_id and o.status<>'cancelled'
  )
  select coalesce(sum(balance),0),count(*) filter(where balance>0)
  into v_pending_amount,v_pending_orders from balances;

  select cs.id,cs.opening_cash,cs.opened_at into v_session_id,v_session_opening,v_session_opened_at
  from public.cash_sessions cs where cs.business_id=p_business_id and cs.closed_at is null
  order by cs.opened_at desc limit 1;

  if v_session_id is not null then
    select coalesce(sum(pt.amount) filter(where pt.entry_type='receipt'),0),
           coalesce(sum(pt.amount) filter(where pt.entry_type='refund'),0)
    into v_cash_receipts,v_cash_refunds
    from public.payment_transactions pt
    where pt.business_id=p_business_id and pt.payment_method='cash' and pt.transaction_at>=v_session_opened_at;

    select coalesce(sum(e.amount),0) into v_cash_expenses
    from public.expenses e where e.business_id=p_business_id and e.payment_method='cash' and e.expense_date>=v_session_opened_at;

    v_cash_session:=jsonb_build_object('id',v_session_id,'opened_at',v_session_opened_at,
      'opening_cash',v_session_opening,'cash_receipts',v_cash_receipts,'cash_refunds',v_cash_refunds,
      'cash_expenses',v_cash_expenses,'expected_cash',v_session_opening+v_cash_receipts-v_cash_refunds-v_cash_expenses);
  end if;

  return jsonb_build_object(
    'business_id',p_business_id,'period_start',p_period_start,'period_end',p_period_end,
    'currency','INR','role',v_role,'customers',v_customers,'open_orders',v_open_orders,
    'new_enquiries',v_new_enquiries,'upcoming_bookings_30d',v_upcoming_bookings,
    'orders_created_today_total',v_orders_today,'gross_receipts',v_receipts,'refunds',v_refunds,
    'net_collections',v_receipts-v_refunds,'collections_by_method',v_receipts_by_method,
    'expenses_total',v_expenses,'expenses_by_method',v_expenses_by_method,
    'operating_cash_movement',v_receipts-v_refunds-v_expenses,
    'pending_customer_balance',v_pending_amount,'orders_with_pending_balance',v_pending_orders,
    'cash_session',v_cash_session
  );
end;
$$;
revoke all on function public.get_accounting_dashboard(uuid,timestamptz,timestamptz) from public,anon;
grant execute on function public.get_accounting_dashboard(uuid,timestamptz,timestamptz) to authenticated;

-- Indexes supporting list and reconciliation screens.
create index if not exists idx_expenses_business_created on public.expenses(business_id,created_at desc);
create index if not exists idx_payments_business_order_date on public.payment_transactions(business_id,order_id,transaction_at desc);

-- Verification examples (use an actual business UUID from public.business_units):
-- select public.get_accounting_dashboard('<business-uuid>'::uuid,date_trunc('month',now()),date_trunc('month',now())+interval '1 month');
-- select public.open_cash_session('<business-uuid>'::uuid,500);
-- select public.close_cash_session('<business-uuid>'::uuid,500,'Closing note');
