-- BHARATEE DIGITAL SERVICE
-- Migration 007: Cyber Café / Digital Service counter workflow.
-- Apply after migrations 001, 003, 004, 005 and 006.
-- All write/read operations used by the UI go through role-checked RPCs.
-- Do not place a Supabase Secret/service_role key in browser code.

create table if not exists public.cyber_cafe_jobs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_units(id) on delete restrict,
  order_id uuid not null unique references public.orders(id) on delete restrict,
  service_kind text not null check (service_kind in (
    'government_application','printing','photocopy','scan','lamination',
    'passport_photo','photo_frame','photo_editing','other'
  )),
  service_name text not null,
  portal_name text,
  application_reference text,
  application_status text not null default 'not_applicable' check (application_status in (
    'not_applicable','not_started','submitted','under_review','approved','rejected','completed'
  )),
  delivery_status text not null default 'pending' check (delivery_status in (
    'pending','ready','delivered','picked_up','cancelled'
  )),
  expected_delivery_at timestamptz,
  document_checklist jsonb not null default '[]'::jsonb
    check (jsonb_typeof(document_checklist) = 'array'),
  details jsonb not null default '{}'::jsonb
    check (jsonb_typeof(details) = 'object'),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cyber_cafe_jobs_service_name_length check (char_length(service_name) between 2 and 180)
);

create index if not exists idx_cyber_jobs_business_created
  on public.cyber_cafe_jobs(business_id, created_at desc);
create index if not exists idx_cyber_jobs_business_delivery
  on public.cyber_cafe_jobs(business_id, delivery_status, expected_delivery_at);
create index if not exists idx_cyber_jobs_application_ref
  on public.cyber_cafe_jobs(business_id, application_reference)
  where application_reference is not null;

alter table public.cyber_cafe_jobs enable row level security;

-- Helper: digital-service staff can read their workspace; only counter roles
-- can create/update jobs. Accountant/viewer have read-only access.
create or replace function public.assert_digital_service_access(
  p_business_id uuid,
  p_write boolean default false
)
returns text
language plpgsql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_role text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_active = true
  ) then
    raise exception 'Your staff profile is inactive' using errcode = '42501';
  end if;

  select bm.role into v_role
  from public.business_members bm
  join public.business_units bu on bu.id = bm.business_id
  where bm.user_id = auth.uid()
    and bm.business_id = p_business_id
    and bm.is_active = true
    and bu.is_active = true
    and bu.code = 'digital-service';

  if v_role is null then
    raise exception 'You do not have access to BHARATEE DIGITAL SERVICE'
      using errcode = '42501';
  end if;

  if p_write and v_role not in ('owner','admin','manager','cyber_staff') then
    raise exception 'Your role cannot create or update counter jobs'
      using errcode = '42501';
  end if;

  if not p_write and v_role not in ('owner','admin','manager','cyber_staff','accountant','viewer') then
    raise exception 'Your role cannot view counter jobs'
      using errcode = '42501';
  end if;

  return v_role;
end;
$$;

revoke all on function public.assert_digital_service_access(uuid, boolean) from public, anon;
grant execute on function public.assert_digital_service_access(uuid, boolean) to authenticated;

-- Dashboard data for the selected Digital Service workspace.
create or replace function public.get_cyber_cafe_dashboard(p_business_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_role text;
  v_today_start timestamptz;
  v_orders_today bigint := 0;
  v_order_value_today numeric(14,2) := 0;
  v_collected_today numeric(14,2) := 0;
  v_refunded_today numeric(14,2) := 0;
  v_collections_by_method jsonb := '{}'::jsonb;
  v_open_jobs bigint := 0;
  v_ready_jobs bigint := 0;
  v_pending_applications bigint := 0;
  v_pending_balance numeric(14,2) := 0;
begin
  v_role := public.assert_digital_service_access(p_business_id, false);
  v_today_start := date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata';

  select count(*), coalesce(sum(o.total),0)
    into v_orders_today, v_order_value_today
  from public.orders o
  join public.cyber_cafe_jobs j on j.order_id = o.id
  where o.business_id = p_business_id
    and o.created_at >= v_today_start
    and o.created_at < v_today_start + interval '1 day'
    and o.status <> 'cancelled';

  select
    coalesce(sum(pt.amount) filter (where pt.entry_type='receipt'),0),
    coalesce(sum(pt.amount) filter (where pt.entry_type='refund'),0)
    into v_collected_today, v_refunded_today
  from public.payment_transactions pt
  where pt.business_id = p_business_id
    and pt.transaction_at >= v_today_start
    and pt.transaction_at < v_today_start + interval '1 day';

  select coalesce(
    jsonb_object_agg(method_name, method_net), '{}'::jsonb
  )
  into v_collections_by_method
  from (
    select pt.payment_method as method_name,
      sum(case when pt.entry_type='receipt' then pt.amount else -pt.amount end) as method_net
    from public.payment_transactions pt
    where pt.business_id = p_business_id
      and pt.transaction_at >= v_today_start
      and pt.transaction_at < v_today_start + interval '1 day'
    group by pt.payment_method
  ) methods;

  select
    count(*) filter (where j.delivery_status not in ('delivered','picked_up','cancelled')),
    count(*) filter (where j.delivery_status='ready'),
    count(*) filter (where j.service_kind='government_application'
                       and j.application_status in ('not_started','submitted','under_review'))
    into v_open_jobs, v_ready_jobs, v_pending_applications
  from public.cyber_cafe_jobs j
  where j.business_id = p_business_id;

  with paid as (
    select pt.order_id,
      sum(case when pt.entry_type='receipt' then pt.amount else -pt.amount end) as net_paid
    from public.payment_transactions pt
    where pt.business_id = p_business_id
    group by pt.order_id
  )
  select coalesce(sum(greatest(o.total-coalesce(p.net_paid,0),0)),0)
    into v_pending_balance
  from public.orders o
  join public.cyber_cafe_jobs j on j.order_id=o.id
  left join paid p on p.order_id=o.id
  where o.business_id=p_business_id and o.status <> 'cancelled';

  return jsonb_build_object(
    'business_id',p_business_id,
    'role',v_role,
    'orders_today',v_orders_today,
    'order_value_today',v_order_value_today,
    'collected_today',v_collected_today,
    'refunded_today',v_refunded_today,
    'net_collected_today',v_collected_today-v_refunded_today,
    'collections_by_method',v_collections_by_method,
    'open_jobs',v_open_jobs,
    'ready_jobs',v_ready_jobs,
    'pending_applications',v_pending_applications,
    'pending_balance',v_pending_balance
  );
end;
$$;

revoke all on function public.get_cyber_cafe_dashboard(uuid) from public, anon;
grant execute on function public.get_cyber_cafe_dashboard(uuid) to authenticated;

-- Search the job register for only the currently selected business.
create or replace function public.list_cyber_cafe_jobs(
  p_business_id uuid,
  p_search text default null,
  p_service_kind text default null,
  p_order_status text default null,
  p_delivery_status text default null,
  p_limit integer default 100
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_jobs jsonb;
begin
  perform public.assert_digital_service_access(p_business_id, false);

  select coalesce(jsonb_agg(to_jsonb(rows) order by rows.created_at desc), '[]'::jsonb)
    into v_jobs
  from (
    select
      j.id as job_id,
      j.order_id,
      o.order_no,
      o.order_type,
      o.status as order_status,
      o.subtotal,
      o.discount,
      o.total,
      o.created_at,
      o.due_at,
      j.service_kind,
      j.service_name,
      j.portal_name,
      j.application_reference,
      j.application_status,
      j.delivery_status,
      j.expected_delivery_at,
      j.document_checklist,
      j.details,
      coalesce(pay.received,0) as received,
      coalesce(pay.refunded,0) as refunded,
      greatest(o.total-coalesce(pay.received,0)+coalesce(pay.refunded,0),0) as balance,
      jsonb_build_object(
        'id',c.id,
        'full_name',c.full_name,
        'phone',c.phone,
        'email',c.email,
        'whatsapp_opt_in',c.whatsapp_opt_in
      ) as customer
    from public.cyber_cafe_jobs j
    join public.orders o on o.id=j.order_id
    left join public.customers c on c.id=o.customer_id
    left join lateral (
      select
        coalesce(sum(pt.amount) filter (where pt.entry_type='receipt'),0) as received,
        coalesce(sum(pt.amount) filter (where pt.entry_type='refund'),0) as refunded
      from public.payment_transactions pt
      where pt.order_id=o.id and pt.business_id=p_business_id
    ) pay on true
    where j.business_id=p_business_id
      and (nullif(btrim(coalesce(p_search,'')),'') is null
        or o.order_no ilike '%'||btrim(p_search)||'%'
        or j.service_name ilike '%'||btrim(p_search)||'%'
        or coalesce(j.application_reference,'') ilike '%'||btrim(p_search)||'%'
        or coalesce(c.full_name,'') ilike '%'||btrim(p_search)||'%'
        or coalesce(c.phone,'') ilike '%'||btrim(p_search)||'%')
      and (p_service_kind is null or j.service_kind=p_service_kind)
      and (p_order_status is null or o.status=p_order_status)
      and (p_delivery_status is null or j.delivery_status=p_delivery_status)
    order by o.created_at desc
    limit greatest(1,least(coalesce(p_limit,100),200))
  ) rows;

  return jsonb_build_object('jobs',v_jobs,'count',jsonb_array_length(v_jobs));
end;
$$;

revoke all on function public.list_cyber_cafe_jobs(uuid,text,text,text,text,integer) from public, anon;
grant execute on function public.list_cyber_cafe_jobs(uuid,text,text,text,text,integer) to authenticated;

-- Create customer + order + counter job + optional first receipt in one transaction.
create or replace function public.create_cyber_cafe_job(
  p_business_id uuid,
  p_customer_id uuid,
  p_customer_name text,
  p_phone text,
  p_email text,
  p_preferred_locale text,
  p_service_kind text,
  p_service_name text,
  p_portal_name text,
  p_application_reference text,
  p_application_status text,
  p_expected_delivery_at timestamptz,
  p_quantity numeric,
  p_unit_price numeric,
  p_discount numeric,
  p_initial_payment numeric,
  p_payment_method text,
  p_payment_reference text,
  p_notes text,
  p_document_checklist jsonb,
  p_details jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_role text;
  v_customer_id uuid;
  v_duplicate_customer uuid;
  v_order_id uuid;
  v_job_id uuid;
  v_payment_id uuid;
  v_order_no text;
  v_phone_digits text;
  v_subtotal numeric(14,2);
  v_total numeric(14,2);
  v_service_kind text;
  v_order_type text;
  v_app_status text;
  v_created_customer boolean := false;
begin
  v_role := public.assert_digital_service_access(p_business_id,true);

  if length(btrim(coalesce(p_customer_name,''))) < 2 then
    raise exception 'Enter a valid customer name' using errcode='22023';
  end if;
  v_phone_digits := regexp_replace(coalesce(p_phone,''),'[^0-9]','','g');
  if length(v_phone_digits) not between 7 and 15 then
    raise exception 'Enter a valid customer phone number' using errcode='22023';
  end if;
  if coalesce(p_preferred_locale,'en') not in ('en','hi','or') then
    raise exception 'Choose English, Hindi or Odia' using errcode='22023';
  end if;

  v_service_kind := coalesce(p_service_kind,'');
  if v_service_kind not in (
    'government_application','printing','photocopy','scan','lamination',
    'passport_photo','photo_frame','photo_editing','other'
  ) then raise exception 'Invalid counter service type' using errcode='22023'; end if;

  if length(btrim(coalesce(p_service_name,''))) not between 2 and 180 then
    raise exception 'Enter a service name or application type' using errcode='22023';
  end if;

  v_app_status := coalesce(nullif(p_application_status,''),'not_applicable');
  if v_app_status not in ('not_applicable','not_started','submitted','under_review','approved','rejected','completed') then
    raise exception 'Invalid government application status' using errcode='22023';
  end if;
  if v_service_kind <> 'government_application' then
    v_app_status := 'not_applicable';
  end if;

  if p_quantity is null or p_quantity <= 0 or p_quantity > 100000 then
    raise exception 'Quantity must be greater than zero' using errcode='22023';
  end if;
  if p_unit_price is null or p_unit_price < 0 or p_unit_price > 99999999 then
    raise exception 'Enter a valid unit price' using errcode='22023';
  end if;
  if coalesce(p_discount,0) < 0 then
    raise exception 'Discount cannot be negative' using errcode='22023';
  end if;

  v_subtotal := round(p_quantity*p_unit_price,2);
  if coalesce(p_discount,0) > v_subtotal then
    raise exception 'Discount cannot exceed subtotal' using errcode='22023';
  end if;
  v_total := v_subtotal-coalesce(p_discount,0);
  if v_total <= 0 then
    raise exception 'Order total must be greater than zero' using errcode='22023';
  end if;
  if coalesce(p_initial_payment,0) < 0 or coalesce(p_initial_payment,0) > v_total then
    raise exception 'Initial payment must be between zero and total amount' using errcode='22023';
  end if;
  if coalesce(p_initial_payment,0) > 0 and coalesce(p_payment_method,'') not in ('cash','upi','bank_transfer','card','other') then
    raise exception 'Choose a valid payment method' using errcode='22023';
  end if;
  if coalesce(p_document_checklist,'[]'::jsonb) <> '[]'::jsonb
     and jsonb_typeof(p_document_checklist) <> 'array' then
    raise exception 'Document checklist must be a JSON array' using errcode='22023';
  end if;
  if coalesce(p_details,'{}'::jsonb) <> '{}'::jsonb
     and jsonb_typeof(p_details) <> 'object' then
    raise exception 'Additional details must be a JSON object' using errcode='22023';
  end if;

  if p_customer_id is not null then
    select c.id into v_customer_id
    from public.customers c
    join public.customer_business_links cbl on cbl.customer_id=c.id
    where c.id=p_customer_id and cbl.business_id=p_business_id
    for update of c;
    if v_customer_id is null then
      raise exception 'Selected customer is not linked to BHARATEE DIGITAL SERVICE' using errcode='42501';
    end if;
  else
    perform pg_advisory_xact_lock(hashtextextended(p_business_id::text||':'||v_phone_digits,0));
    select c.id into v_duplicate_customer
    from public.customers c
    join public.customer_business_links cbl on cbl.customer_id=c.id
    where cbl.business_id=p_business_id
      and regexp_replace(coalesce(c.phone,''),'[^0-9]','','g')=v_phone_digits
    order by c.updated_at desc limit 1
    for update of c;

    if v_duplicate_customer is not null then
      v_customer_id := v_duplicate_customer;
      update public.customers
      set full_name=left(btrim(p_customer_name),120),
          email=coalesce(nullif(lower(btrim(coalesce(p_email,''))),''),email),
          preferred_locale=coalesce(p_preferred_locale,'en'),
          updated_at=now()
      where id=v_customer_id;
    else
      insert into public.customers(full_name,phone,email,preferred_locale,created_by)
      values(left(btrim(p_customer_name),120),left(btrim(p_phone),32),
        nullif(lower(btrim(coalesce(p_email,''))),''),coalesce(p_preferred_locale,'en'),auth.uid())
      returning id into v_customer_id;
      insert into public.customer_business_links(customer_id,business_id,created_by)
      values(v_customer_id,p_business_id,auth.uid());
      v_created_customer := true;
    end if;
  end if;

  v_order_type := case v_service_kind
    when 'printing' then 'printing'
    when 'photocopy' then 'photocopy'
    when 'scan' then 'scan'
    when 'lamination' then 'lamination'
    when 'passport_photo' then 'passport_photo'
    when 'photo_frame' then 'photo_frame'
    when 'photo_editing' then 'photo_editing'
    when 'government_application' then 'other'
    else 'other'
  end;

  v_order_no := 'BDS-'||
    to_char(now() at time zone 'Asia/Kolkata','YYMMDD')||'-'||
    upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));

  insert into public.orders(
    business_id,customer_id,order_no,order_type,status,due_at,
    subtotal,discount,total,notes,created_by
  ) values (
    p_business_id,v_customer_id,v_order_no,v_order_type,'received',
    p_expected_delivery_at,v_subtotal,coalesce(p_discount,0),v_total,
    nullif(left(btrim(coalesce(p_notes,'')),2000),''),auth.uid()
  ) returning id into v_order_id;

  insert into public.order_items(order_id,description,quantity,unit_price)
  values(v_order_id,left(btrim(p_service_name),180),p_quantity,p_unit_price);

  insert into public.cyber_cafe_jobs(
    business_id,order_id,service_kind,service_name,portal_name,application_reference,
    application_status,delivery_status,expected_delivery_at,document_checklist,details,created_by
  ) values (
    p_business_id,v_order_id,v_service_kind,left(btrim(p_service_name),180),
    nullif(left(btrim(coalesce(p_portal_name,'')),180),''),
    nullif(left(btrim(coalesce(p_application_reference,'')),120),''),
    v_app_status,'pending',p_expected_delivery_at,
    case when jsonb_typeof(coalesce(p_document_checklist,'[]'::jsonb))='array'
      then coalesce(p_document_checklist,'[]'::jsonb) else '[]'::jsonb end,
    case when jsonb_typeof(coalesce(p_details,'{}'::jsonb))='object'
      then coalesce(p_details,'{}'::jsonb) else '{}'::jsonb end,
    auth.uid()
  ) returning id into v_job_id;

  if coalesce(p_initial_payment,0)>0 then
    insert into public.payment_transactions(
      business_id,order_id,entry_type,amount,payment_method,reference_no,transaction_at,note,recorded_by
    ) values (
      p_business_id,v_order_id,'receipt',p_initial_payment,p_payment_method,
      nullif(left(btrim(coalesce(p_payment_reference,'')),120),''),
      now(),'Digital Service counter payment',auth.uid()
    ) returning id into v_payment_id;
  end if;

  insert into public.activity_logs(business_id,actor_id,action,entity_type,entity_id,metadata)
  values(p_business_id,auth.uid(),'cyber_cafe_job_created','cyber_cafe_job',v_job_id::text,
    jsonb_build_object('order_no',v_order_no,'service_kind',v_service_kind,'total',v_total,
      'initial_payment',coalesce(p_initial_payment,0),'customer_created',v_created_customer));

  return jsonb_build_object(
    'job_id',v_job_id,'order_id',v_order_id,'order_no',v_order_no,'customer_id',v_customer_id,
    'payment_id',v_payment_id,'subtotal',v_subtotal,'discount',coalesce(p_discount,0),
    'total',v_total,'initial_payment',coalesce(p_initial_payment,0),
    'balance',v_total-coalesce(p_initial_payment,0),'customer_created',v_created_customer
  );
end;
$$;

revoke all on function public.create_cyber_cafe_job(uuid,uuid,text,text,text,text,text,text,text,text,text,timestamptz,numeric,numeric,numeric,numeric,text,text,text,jsonb,jsonb) from public, anon;
grant execute on function public.create_cyber_cafe_job(uuid,uuid,text,text,text,text,text,text,text,text,text,timestamptz,numeric,numeric,numeric,numeric,text,text,text,jsonb,jsonb) to authenticated;

-- Record further customer payment; amount cannot exceed the current outstanding balance.
create or replace function public.record_cyber_cafe_job_payment(
  p_business_id uuid,
  p_order_id uuid,
  p_amount numeric,
  p_payment_method text,
  p_reference_no text,
  p_note text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_role text;
  v_total numeric(14,2);
  v_paid numeric(14,2);
  v_balance numeric(14,2);
  v_payment_id uuid;
begin
  v_role := public.assert_digital_service_access(p_business_id,true);
  if p_amount is null or p_amount <= 0 then
    raise exception 'Payment amount must be greater than zero' using errcode='22023';
  end if;
  if p_payment_method not in ('cash','upi','bank_transfer','card','other') then
    raise exception 'Invalid payment method' using errcode='22023';
  end if;

  select o.total into v_total
  from public.orders o
  join public.cyber_cafe_jobs j on j.order_id=o.id
  where o.id=p_order_id and o.business_id=p_business_id
  for update of o;
  if v_total is null then
    raise exception 'Counter job not found in this business' using errcode='42501';
  end if;

  select coalesce(sum(case when pt.entry_type='receipt' then pt.amount else -pt.amount end),0)
    into v_paid
  from public.payment_transactions pt
  where pt.business_id=p_business_id and pt.order_id=p_order_id;
  v_balance := greatest(v_total-v_paid,0);

  if p_amount > v_balance then
    raise exception 'Payment exceeds the outstanding balance of %',v_balance using errcode='22023';
  end if;

  insert into public.payment_transactions(
    business_id,order_id,entry_type,amount,payment_method,reference_no,transaction_at,note,recorded_by
  ) values (
    p_business_id,p_order_id,'receipt',p_amount,p_payment_method,
    nullif(left(btrim(coalesce(p_reference_no,'')),120),''),
    now(),nullif(left(btrim(coalesce(p_note,'')),500),''),auth.uid()
  ) returning id into v_payment_id;

  insert into public.activity_logs(business_id,actor_id,action,entity_type,entity_id,metadata)
  values(p_business_id,auth.uid(),'cyber_cafe_payment_recorded','order',p_order_id::text,
    jsonb_build_object('amount',p_amount,'method',p_payment_method,'payment_id',v_payment_id));

  return jsonb_build_object('payment_id',v_payment_id,'balance',v_balance-p_amount);
end;
$$;

revoke all on function public.record_cyber_cafe_job_payment(uuid,uuid,numeric,text,text,text) from public, anon;
grant execute on function public.record_cyber_cafe_job_payment(uuid,uuid,numeric,text,text,text) to authenticated;

-- Update the operational, application and delivery stages of an existing counter job.
create or replace function public.update_cyber_cafe_job(
  p_business_id uuid,
  p_job_id uuid,
  p_order_status text,
  p_application_status text,
  p_delivery_status text,
  p_application_reference text,
  p_expected_delivery_at timestamptz,
  p_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_role text;
  v_order_id uuid;
begin
  v_role := public.assert_digital_service_access(p_business_id,true);

  if p_order_status is not null and p_order_status not in ('received','in_progress','ready','delivered','cancelled','on_hold') then
    raise exception 'Invalid order status' using errcode='22023';
  end if;
  if p_application_status is not null and p_application_status not in ('not_applicable','not_started','submitted','under_review','approved','rejected','completed') then
    raise exception 'Invalid application status' using errcode='22023';
  end if;
  if p_delivery_status is not null and p_delivery_status not in ('pending','ready','delivered','picked_up','cancelled') then
    raise exception 'Invalid delivery status' using errcode='22023';
  end if;

  select order_id into v_order_id
  from public.cyber_cafe_jobs
  where id=p_job_id and business_id=p_business_id
  for update;
  if v_order_id is null then
    raise exception 'Counter job not found' using errcode='42501';
  end if;

  update public.cyber_cafe_jobs
  set application_status=coalesce(p_application_status,application_status),
      delivery_status=coalesce(p_delivery_status,delivery_status),
      application_reference=case when p_application_reference is null then application_reference
        else nullif(left(btrim(p_application_reference),120),'') end,
      expected_delivery_at=coalesce(p_expected_delivery_at,expected_delivery_at),
      updated_at=now()
  where id=p_job_id;

  update public.orders
  set status=case
      when p_delivery_status in ('delivered','picked_up') then 'delivered'
      when p_delivery_status='ready' then 'ready'
      else coalesce(p_order_status,status)
    end,
      due_at=coalesce(p_expected_delivery_at,due_at),
      notes=case when p_notes is null then notes else nullif(left(btrim(p_notes),2000),'') end,
      updated_at=now()
  where id=v_order_id and business_id=p_business_id;

  insert into public.activity_logs(business_id,actor_id,action,entity_type,entity_id,metadata)
  values(p_business_id,auth.uid(),'cyber_cafe_job_updated','cyber_cafe_job',p_job_id::text,
    jsonb_build_object('order_status',p_order_status,'application_status',p_application_status,
      'delivery_status',p_delivery_status));

  return jsonb_build_object('job_id',p_job_id,'updated',true);
end;
$$;

revoke all on function public.update_cyber_cafe_job(uuid,uuid,text,text,text,text,timestamptz,text) from public, anon;
grant execute on function public.update_cyber_cafe_job(uuid,uuid,text,text,text,text,timestamptz,text) to authenticated;
