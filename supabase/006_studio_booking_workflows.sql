-- BHARATEE GRAPHIX — Migration 006: studio and wedding booking workflows.
-- Apply once after the existing base schema and finance migrations.
-- Functions are SECURITY DEFINER but perform their own authenticated role checks.

create extension if not exists pgcrypto;

-- Production workflow checklist attached to every studio booking.
create table if not exists public.studio_booking_tasks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_units(id) on delete restrict,
  booking_id uuid not null references public.studio_bookings(id) on delete cascade,
  task_code text not null check (task_code in ('shoot','photo_editing','video_editing','album_design','client_review','delivery')),
  title_i18n jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','in_progress','review','completed','blocked')),
  assigned_to uuid references public.profiles(id) on delete set null,
  due_at timestamptz,
  completed_at timestamptz,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booking_id, task_code)
);

create index if not exists idx_studio_tasks_booking
  on public.studio_booking_tasks (business_id, booking_id, sort_order);
create index if not exists idx_studio_bookings_status_date
  on public.studio_bookings (business_id, status, starts_at);

alter table public.studio_booking_tasks enable row level security;
revoke all on public.studio_booking_tasks from anon, authenticated;

-- Internal authorization helper. Studio operations are restricted to Graphix.
create or replace function public.assert_graphix_studio_access(p_business_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_role text;
  v_code text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select code into v_code
  from public.business_units
  where id = p_business_id and is_active = true;

  if v_code is distinct from 'graphix' then
    raise exception 'Studio bookings are available only in the BHARATEE GRAPHIX workspace'
      using errcode = '42501';
  end if;

  select bm.role into v_role
  from public.business_members bm
  join public.profiles p on p.id = bm.user_id and p.is_active = true
  where bm.user_id = auth.uid()
    and bm.business_id = p_business_id
    and bm.is_active = true;

  if v_role is null or v_role not in ('owner','admin','manager','studio_staff') then
    raise exception 'You do not have permission to manage BHARATEE GRAPHIX bookings'
      using errcode = '42501';
  end if;
  return v_role;
end;
$$;
revoke all on function public.assert_graphix_studio_access(uuid) from public, anon, authenticated;

-- Return active Graphix packages to an authenticated studio user.
create or replace function public.list_studio_packages(p_business_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare v_result jsonb;
begin
  perform public.assert_graphix_studio_access(p_business_id);
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', sp.id,
    'package_code', sp.package_code,
    'name_i18n', sp.name_i18n,
    'description_i18n', sp.description_i18n,
    'inclusions_i18n', sp.inclusions_i18n,
    'base_price', sp.base_price,
    'is_active', sp.is_active
  ) order by sp.sort_order, sp.created_at), '[]'::jsonb)
  into v_result
  from public.studio_packages sp
  where sp.business_id = p_business_id and sp.is_active = true;
  return v_result;
end;
$$;
revoke all on function public.list_studio_packages(uuid) from public, anon;
grant execute on function public.list_studio_packages(uuid) to authenticated;

-- Create/update a Graphix package. Owner/Admin/Manager only.
create or replace function public.save_studio_package(
  p_business_id uuid,
  p_package_id uuid,
  p_package_code text,
  p_name_i18n jsonb,
  p_description_i18n jsonb,
  p_inclusions_i18n jsonb,
  p_base_price numeric,
  p_is_active boolean
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_role text;
  v_id uuid;
  v_code text;
begin
  v_role := public.assert_graphix_studio_access(p_business_id);
  if v_role not in ('owner','admin','manager') then
    raise exception 'Only Owner, Admin or Manager can manage studio packages' using errcode = '42501';
  end if;
  if p_base_price is null or p_base_price < 0 or p_base_price > 99999999 then
    raise exception 'Enter a valid non-negative package price' using errcode = '22023';
  end if;
  if nullif(btrim(coalesce(p_name_i18n->>'en','')), '') is null then
    raise exception 'Package name in English is required' using errcode = '22023';
  end if;
  v_code := nullif(upper(left(btrim(coalesce(p_package_code,'')), 30)), '');

  if p_package_id is null then
    insert into public.studio_packages(
      business_id, package_code, name_i18n, description_i18n,
      inclusions_i18n, base_price, is_active, is_public
    ) values (
      p_business_id, v_code, p_name_i18n,
      coalesce(p_description_i18n, '{}'::jsonb),
      coalesce(p_inclusions_i18n, '[]'::jsonb),
      p_base_price, coalesce(p_is_active, true), false
    ) returning id into v_id;
  else
    update public.studio_packages
    set package_code = v_code,
        name_i18n = p_name_i18n,
        description_i18n = coalesce(p_description_i18n, '{}'::jsonb),
        inclusions_i18n = coalesce(p_inclusions_i18n, '[]'::jsonb),
        base_price = p_base_price,
        is_active = coalesce(p_is_active, true),
        updated_at = now()
    where id = p_package_id and business_id = p_business_id
    returning id into v_id;
    if v_id is null then raise exception 'Package not found in this business' using errcode = 'P0002'; end if;
  end if;

  insert into public.activity_logs(business_id, actor_id, action, entity_type, entity_id, metadata)
  values(p_business_id, auth.uid(), case when p_package_id is null then 'studio_package_created' else 'studio_package_updated' end,
    'studio_package', v_id::text, jsonb_build_object('package_code',v_code,'base_price',p_base_price));
  return jsonb_build_object('package_id', v_id);
end;
$$;
revoke all on function public.save_studio_package(uuid,uuid,text,jsonb,jsonb,jsonb,numeric,boolean) from public, anon;
grant execute on function public.save_studio_package(uuid,uuid,text,jsonb,jsonb,jsonb,numeric,boolean) to authenticated;

-- Atomically create customer/link if needed, order, advance receipt, booking and production checklist.
create or replace function public.create_studio_booking(
  p_business_id uuid,
  p_customer_id uuid,
  p_customer_name text,
  p_phone text,
  p_email text,
  p_preferred_locale text,
  p_event_type text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_venue_name text,
  p_venue_address text,
  p_city text,
  p_package_id uuid,
  p_package_name text,
  p_total numeric,
  p_advance numeric,
  p_payment_method text,
  p_status text,
  p_allow_overlap boolean,
  p_referral_source text,
  p_shoot_notes text,
  p_assigned_to uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_role text;
  v_customer_id uuid;
  v_order_id uuid;
  v_booking_id uuid;
  v_order_no text;
  v_phone text;
  v_phone_digits text;
  v_event_label text;
  v_conflict_count integer;
  v_payment_id uuid;
  v_code text;
begin
  v_role := public.assert_graphix_studio_access(p_business_id);

  if length(btrim(coalesce(p_customer_name,''))) < 2 then
    raise exception 'Enter the customer name' using errcode = '22023';
  end if;
  v_phone := nullif(btrim(coalesce(p_phone,'')), '');
  v_phone_digits := regexp_replace(coalesce(v_phone,''), '[^0-9]', '', 'g');
  if length(v_phone_digits) not between 7 and 15 then
    raise exception 'Enter a valid customer phone number' using errcode = '22023';
  end if;
  if p_preferred_locale not in ('en','hi','or') then
    raise exception 'Choose English, Hindi or Odia for the customer' using errcode = '22023';
  end if;
  if p_event_type not in ('wedding','pre_wedding','engagement','birthday','anniversary','event','photography','videography','other') then
    raise exception 'Invalid event type' using errcode = '22023';
  end if;
  if p_starts_at is null or p_ends_at is null or p_ends_at <= p_starts_at then
    raise exception 'Event end must be later than event start' using errcode = '22023';
  end if;
  if p_total is null or p_total <= 0 or p_total > 99999999 then
    raise exception 'Enter a valid quotation total greater than zero' using errcode = '22023';
  end if;
  if coalesce(p_advance,0) < 0 or coalesce(p_advance,0) > p_total then
    raise exception 'Advance must be between zero and the quotation total' using errcode = '22023';
  end if;
  if coalesce(p_advance,0) > 0 and p_payment_method not in ('cash','upi','bank_transfer','card','other') then
    raise exception 'Choose a valid payment method for the advance' using errcode = '22023';
  end if;
  if p_status not in ('enquiry','quoted','tentative','confirmed') then
    raise exception 'New booking status must be enquiry, quoted, tentative or confirmed' using errcode = '22023';
  end if;

  if p_package_id is not null then
    if not exists(select 1 from public.studio_packages sp where sp.id=p_package_id and sp.business_id=p_business_id and sp.is_active=true) then
      raise exception 'Selected package is not active in BHARATEE GRAPHIX' using errcode = '22023';
    end if;
  end if;
  if p_assigned_to is not null and not exists(
    select 1 from public.business_members bm
    where bm.user_id=p_assigned_to and bm.business_id=p_business_id and bm.is_active=true
      and bm.role in ('owner','admin','manager','studio_staff')
  ) then raise exception 'Assigned staff member is not active in this business' using errcode = '22023'; end if;

  -- Serialize schedule checks for this business; overlapping events require an explicit override.
  perform pg_advisory_xact_lock(hashtextextended(p_business_id::text, 0));
  select count(*) into v_conflict_count
  from public.studio_bookings sb
  where sb.business_id=p_business_id
    and sb.status <> 'cancelled'
    and sb.starts_at < p_ends_at
    and sb.ends_at > p_starts_at;
  if v_conflict_count > 0 and not coalesce(p_allow_overlap,false) then
    raise exception 'Schedule conflict: another active booking overlaps this event. Review the calendar or explicitly allow an overlap.'
      using errcode = '23P01';
  end if;

  if p_customer_id is not null then
    select c.id into v_customer_id
    from public.customers c
    join public.customer_business_links cbl on cbl.customer_id=c.id
    where c.id=p_customer_id and cbl.business_id=p_business_id
    for update of c;
    if v_customer_id is null then raise exception 'Selected customer is not linked to BHARATEE GRAPHIX' using errcode = '42501'; end if;
  else
    select c.id into v_customer_id
    from public.customers c
    join public.customer_business_links cbl on cbl.customer_id=c.id
    where cbl.business_id=p_business_id
      and regexp_replace(coalesce(c.phone,''),'[^0-9]','','g')=v_phone_digits
    order by c.updated_at desc limit 1
    for update of c;

    if v_customer_id is null then
      insert into public.customers(full_name,phone,email,preferred_locale,created_by)
      values(left(btrim(p_customer_name),120),v_phone,nullif(lower(btrim(coalesce(p_email,''))),''),p_preferred_locale,auth.uid())
      returning id into v_customer_id;
      insert into public.customer_business_links(customer_id,business_id,created_by)
      values(v_customer_id,p_business_id,auth.uid());
    end if;
  end if;

  select code into v_code from public.business_units where id=p_business_id;
  v_order_no := format('BGX-%s-%s',to_char(p_starts_at at time zone 'Asia/Kolkata','YYYYMMDD'),upper(substr(replace(gen_random_uuid()::text,'-',''),1,6)));
  v_event_label := replace(initcap(replace(p_event_type,'_',' ')),'  ',' ');

  insert into public.orders(
    business_id,customer_id,order_no,order_type,status,due_at,subtotal,discount,total,notes,created_by,assigned_to
  ) values (
    p_business_id,v_customer_id,v_order_no,
    case when p_event_type='wedding' then 'wedding' when p_event_type='videography' then 'videography' else 'photography' end,
    'received',p_starts_at,p_total,0,p_total,nullif(btrim(coalesce(p_shoot_notes,'')),''),auth.uid(),p_assigned_to
  ) returning id into v_order_id;

  insert into public.order_items(order_id,description,quantity,unit_price)
  values(v_order_id,coalesce(nullif(btrim(coalesce(p_package_name,'')),''),v_event_label||' booking'),1,p_total);

  insert into public.studio_bookings(
    business_id,order_id,package_id,event_type,starts_at,ends_at,venue_name,venue_address,city,status,
    referral_source,shoot_notes,assigned_to
  ) values (
    p_business_id,v_order_id,p_package_id,p_event_type,p_starts_at,p_ends_at,
    nullif(btrim(coalesce(p_venue_name,'')),''),nullif(btrim(coalesce(p_venue_address,'')),''),
    nullif(btrim(coalesce(p_city,'')),''),p_status,
    nullif(btrim(coalesce(p_referral_source,'')),''),nullif(btrim(coalesce(p_shoot_notes,'')),''),p_assigned_to
  ) returning id into v_booking_id;

  if coalesce(p_advance,0) > 0 then
    insert into public.payment_transactions(business_id,order_id,entry_type,amount,payment_method,transaction_at,note,recorded_by)
    values(p_business_id,v_order_id,'receipt',p_advance,p_payment_method,now(),'Studio booking advance',auth.uid())
    returning id into v_payment_id;
  end if;

  insert into public.studio_booking_tasks(business_id,booking_id,task_code,title_i18n,sort_order)
  values
    (p_business_id,v_booking_id,'shoot','{"en":"Shoot / Event Coverage","hi":"फोटो / वीडियो शूट","or":"ଫଟୋ / ଭିଡିଓ ସୁଟ୍"}'::jsonb,1),
    (p_business_id,v_booking_id,'photo_editing','{"en":"Photo Selection & Editing","hi":"फोटो चयन और एडिटिंग","or":"ଫଟୋ ଚୟନ ଓ ଏଡିଟିଂ"}'::jsonb,2),
    (p_business_id,v_booking_id,'video_editing','{"en":"Video Editing","hi":"वीडियो एडिटिंग","or":"ଭିଡିଓ ଏଡିଟିଂ"}'::jsonb,3),
    (p_business_id,v_booking_id,'album_design','{"en":"Album Design & Printing","hi":"एल्बम डिजाइन और प्रिंटिंग","or":"ଆଲବମ୍ ଡିଜାଇନ୍ ଓ ପ୍ରିଣ୍ଟିଂ"}'::jsonb,4),
    (p_business_id,v_booking_id,'client_review','{"en":"Client Review & Approval","hi":"ग्राहक समीक्षा और मंजूरी","or":"ଗ୍ରାହକ ସମୀକ୍ଷା ଓ ଅନୁମୋଦନ"}'::jsonb,5),
    (p_business_id,v_booking_id,'delivery','{"en":"Final Delivery","hi":"अंतिम डिलीवरी","or":"ଅନ୍ତିମ ଡେଲିଭରି"}'::jsonb,6);

  insert into public.activity_logs(business_id,actor_id,action,entity_type,entity_id,metadata)
  values(p_business_id,auth.uid(),'studio_booking_created','studio_booking',v_booking_id::text,
    jsonb_build_object('order_no',v_order_no,'event_type',p_event_type,'starts_at',p_starts_at,'total',p_total,'advance',coalesce(p_advance,0)));

  return jsonb_build_object(
    'booking_id',v_booking_id,'order_id',v_order_id,'order_no',v_order_no,
    'customer_id',v_customer_id,'payment_id',v_payment_id,
    'total',p_total,'advance',coalesce(p_advance,0),'balance',p_total-coalesce(p_advance,0),
    'schedule_conflict_overridden',v_conflict_count>0 and coalesce(p_allow_overlap,false)
  );
end;
$$;
revoke all on function public.create_studio_booking(uuid,uuid,text,text,text,text,text,timestamptz,timestamptz,text,text,text,uuid,text,numeric,numeric,text,text,boolean,text,text,uuid) from public, anon;
grant execute on function public.create_studio_booking(uuid,uuid,text,text,text,text,text,timestamptz,timestamptz,text,text,text,uuid,text,numeric,numeric,text,text,boolean,text,text,uuid) to authenticated;

-- List bookings and their linked finance/task summaries for the Graphix workspace.
create or replace function public.list_studio_bookings(
  p_business_id uuid,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_status text default null,
  p_limit integer default 100
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare v_result jsonb;
begin
  perform public.assert_graphix_studio_access(p_business_id);
  select coalesce(jsonb_agg(q.item order by q.starts_at),'[]'::jsonb)
  into v_result
  from (
    select sb.starts_at,
      jsonb_build_object(
        'booking_id',sb.id,'order_id',o.id,'order_no',o.order_no,
        'event_type',sb.event_type,'starts_at',sb.starts_at,'ends_at',sb.ends_at,
        'venue_name',sb.venue_name,'venue_address',sb.venue_address,'city',sb.city,
        'status',sb.status,'referral_source',sb.referral_source,'shoot_notes',sb.shoot_notes,
        'delivery_link',sb.delivery_link,'package_id',sp.id,
        'package_name',coalesce(sp.name_i18n->>'en',o.order_type),
        'total',o.total,'received',coalesce(pay.received,0),'refunded',coalesce(pay.refunded,0),
        'balance',greatest(o.total-coalesce(pay.received,0)+coalesce(pay.refunded,0),0),
        'customer',jsonb_build_object('id',c.id,'full_name',c.full_name,'phone',c.phone,'email',c.email,'whatsapp_opt_in',c.whatsapp_opt_in,'preferred_locale',c.preferred_locale),
        'assigned_to',sb.assigned_to,
        'tasks',coalesce(tasks.task_list,'[]'::jsonb)
      ) as item
    from public.studio_bookings sb
    join public.orders o on o.id=sb.order_id
    left join public.customers c on c.id=o.customer_id
    left join public.studio_packages sp on sp.id=sb.package_id
    left join lateral (
      select sum(pt.amount) filter(where pt.entry_type='receipt') as received,
             sum(pt.amount) filter(where pt.entry_type='refund') as refunded
      from public.payment_transactions pt where pt.business_id=p_business_id and pt.order_id=o.id
    ) pay on true
    left join lateral (
      select jsonb_agg(jsonb_build_object(
        'id',t.id,'task_code',t.task_code,'title_i18n',t.title_i18n,
        'status',t.status,'due_at',t.due_at,'notes',t.notes,'assigned_to',t.assigned_to
      ) order by t.sort_order) as task_list
      from public.studio_booking_tasks t where t.booking_id=sb.id and t.business_id=p_business_id
    ) tasks on true
    where sb.business_id=p_business_id
      and (p_from is null or sb.starts_at>=p_from)
      and (p_to is null or sb.starts_at<p_to)
      and (p_status is null or sb.status=p_status)
    order by sb.starts_at
    limit greatest(1,least(coalesce(p_limit,100),250))
  ) q;
  return v_result;
end;
$$;
revoke all on function public.list_studio_bookings(uuid,timestamptz,timestamptz,text,integer) from public, anon;
grant execute on function public.list_studio_bookings(uuid,timestamptz,timestamptz,text,integer) to authenticated;

-- Change operational booking status and keep its linked order status aligned.
create or replace function public.update_studio_booking_status(
  p_business_id uuid,
  p_booking_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare v_order_id uuid;
begin
  perform public.assert_graphix_studio_access(p_business_id);
  if p_status not in ('enquiry','quoted','tentative','confirmed','in_progress','editing','review','delivered','completed','cancelled') then
    raise exception 'Invalid booking status' using errcode = '22023';
  end if;
  update public.studio_bookings
  set status=p_status,updated_at=now()
  where id=p_booking_id and business_id=p_business_id
  returning order_id into v_order_id;
  if v_order_id is null then raise exception 'Booking not found in this business' using errcode = 'P0002'; end if;

  update public.orders
  set status=case
    when p_status='cancelled' then 'cancelled'
    when p_status in ('in_progress','editing','review') then 'in_progress'
    when p_status in ('delivered','completed') then 'delivered'
    else 'received'
  end,updated_at=now()
  where id=v_order_id and business_id=p_business_id;

  insert into public.activity_logs(business_id,actor_id,action,entity_type,entity_id,metadata)
  values(p_business_id,auth.uid(),'studio_booking_status_updated','studio_booking',p_booking_id::text,jsonb_build_object('status',p_status));
  return jsonb_build_object('booking_id',p_booking_id,'status',p_status);
end;
$$;
revoke all on function public.update_studio_booking_status(uuid,uuid,text) from public, anon;
grant execute on function public.update_studio_booking_status(uuid,uuid,text) to authenticated;

-- Update a single production task.
create or replace function public.update_studio_booking_task(
  p_business_id uuid,
  p_task_id uuid,
  p_status text,
  p_due_at timestamptz,
  p_notes text,
  p_assigned_to uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare v_role text; v_booking_id uuid;
begin
  v_role := public.assert_graphix_studio_access(p_business_id);
  if p_status not in ('pending','in_progress','review','completed','blocked') then
    raise exception 'Invalid production task status' using errcode = '22023';
  end if;
  if p_assigned_to is not null and not exists(
    select 1 from public.business_members bm where bm.user_id=p_assigned_to
      and bm.business_id=p_business_id and bm.is_active=true
      and bm.role in ('owner','admin','manager','studio_staff')
  ) then raise exception 'Assigned staff member is not active in this business' using errcode = '22023'; end if;

  update public.studio_booking_tasks
  set status=p_status,due_at=coalesce(p_due_at,due_at),
      notes=coalesce(nullif(left(btrim(coalesce(p_notes,'')),2000),''),notes),
      assigned_to=coalesce(p_assigned_to,assigned_to),
      completed_at=case when p_status='completed' then coalesce(completed_at,now()) else null end,
      updated_at=now()
  where id=p_task_id and business_id=p_business_id
  returning booking_id into v_booking_id;
  if v_booking_id is null then raise exception 'Production task not found' using errcode = 'P0002'; end if;

  insert into public.activity_logs(business_id,actor_id,action,entity_type,entity_id,metadata)
  values(p_business_id,auth.uid(),'studio_task_updated','studio_booking_task',p_task_id::text,jsonb_build_object('status',p_status));
  return jsonb_build_object('task_id',p_task_id,'booking_id',v_booking_id,'status',p_status);
end;
$$;
revoke all on function public.update_studio_booking_task(uuid,uuid,text,timestamptz,text,uuid) from public, anon;
grant execute on function public.update_studio_booking_task(uuid,uuid,text,timestamptz,text,uuid) to authenticated;

comment on table public.studio_booking_tasks is 'Per-booking photography, video, album review and delivery workflow tasks.';
