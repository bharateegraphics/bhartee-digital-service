-- BHARATEE GRAPHIX — Migration 009: customer album delivery portal.
-- Apply once after migrations 001–008 in the Supabase SQL Editor.
-- Customers sign in with mobile number + project/order ID + an 8-digit PIN.
-- Only PIN hashes and hashed session tokens are stored. Delivery URLs are returned
-- only to a valid portal session and only after the booking is marked delivered.

create extension if not exists pgcrypto;

create table if not exists public.client_portal_access (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_units(id) on delete cascade,
  booking_id uuid not null unique references public.studio_bookings(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  project_id text not null,
  phone_last10 text not null check (phone_last10 ~ '^[0-9]{10}$'),
  pin_hash text not null,
  is_active boolean not null default true,
  failed_attempts integer not null default 0 check (failed_attempts >= 0),
  locked_until timestamptz,
  pin_updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, project_id)
);

create index if not exists idx_client_portal_access_customer
  on public.client_portal_access(customer_id, business_id);

create table if not exists public.client_portal_sessions (
  token_hash text primary key check (token_hash ~ '^[a-f0-9]{64}$'),
  access_id uuid not null references public.client_portal_access(id) on delete cascade,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists idx_client_portal_sessions_access
  on public.client_portal_sessions(access_id, expires_at);

create table if not exists public.client_portal_queries (
  id uuid primary key default gen_random_uuid(),
  access_id uuid not null references public.client_portal_access(id) on delete cascade,
  message text not null check (char_length(message) between 5 and 2000),
  response text,
  status text not null default 'new'
    check (status in ('new','in_progress','replied','closed')),
  created_at timestamptz not null default now(),
  replied_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists idx_client_portal_queries_access
  on public.client_portal_queries(access_id, created_at desc);

alter table public.client_portal_access enable row level security;
alter table public.client_portal_sessions enable row level security;
alter table public.client_portal_queries enable row level security;

-- All access is through the narrowly scoped SECURITY DEFINER RPCs below.
revoke all on public.client_portal_access from public, anon, authenticated;
revoke all on public.client_portal_sessions from public, anon, authenticated;
revoke all on public.client_portal_queries from public, anon, authenticated;

create or replace function public.assert_client_portal_admin(p_business_id uuid)
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
    raise exception 'Client delivery portal is available only for BHARATEE GRAPHIX'
      using errcode = '42501';
  end if;

  select bm.role into v_role
  from public.business_members bm
  join public.profiles p on p.id = bm.user_id and p.is_active = true
  where bm.user_id = auth.uid()
    and bm.business_id = p_business_id
    and bm.is_active = true;

  if v_role is null or v_role not in ('owner','admin','manager') then
    raise exception 'Only Owner, Admin or Manager can manage client portal access'
      using errcode = '42501';
  end if;

  return v_role;
end;
$$;
revoke all on function public.assert_client_portal_admin(uuid) from public, anon, authenticated;

create or replace function public.admin_list_client_portal_projects(p_business_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_result jsonb;
begin
  perform public.assert_client_portal_admin(p_business_id);

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'booking_id', sb.id,
      'project_id', o.order_no,
      'customer_name', c.full_name,
      'phone', c.phone,
      'event_type', sb.event_type,
      'starts_at', sb.starts_at,
      'booking_status', sb.status,
      'delivery_link', sb.delivery_link,
      'portal_active', coalesce(a.is_active, false),
      'pin_set', a.id is not null,
      'query_count', coalesce(q.query_count, 0)
    ) order by sb.starts_at desc
  ), '[]'::jsonb)
  into v_result
  from public.studio_bookings sb
  join public.orders o on o.id = sb.order_id
  join public.customers c on c.id = o.customer_id
  left join public.client_portal_access a on a.booking_id = sb.id
  left join lateral (
    select count(*)::integer as query_count
    from public.client_portal_queries cpq
    where cpq.access_id = a.id and cpq.status <> 'closed'
  ) q on true
  where sb.business_id = p_business_id;

  return v_result;
end;
$$;
revoke all on function public.admin_list_client_portal_projects(uuid) from public, anon;
grant execute on function public.admin_list_client_portal_projects(uuid) to authenticated;

create or replace function public.admin_set_client_portal_pin(
  p_booking_id uuid,
  p_pin text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_business_id uuid;
  v_customer_id uuid;
  v_project_id text;
  v_phone_last10 text;
  v_access_id uuid;
begin
  if p_pin is null or p_pin !~ '^[0-9]{8}$' then
    raise exception 'PIN must contain exactly 8 digits' using errcode = '22023';
  end if;

  select sb.business_id, o.customer_id, o.order_no,
         right(regexp_replace(coalesce(c.phone,''), '[^0-9]', '', 'g'), 10)
    into v_business_id, v_customer_id, v_project_id, v_phone_last10
  from public.studio_bookings sb
  join public.orders o on o.id = sb.order_id
  join public.customers c on c.id = o.customer_id
  where sb.id = p_booking_id;

  if v_business_id is null then
    raise exception 'Studio project not found' using errcode = 'P0002';
  end if;
  perform public.assert_client_portal_admin(v_business_id);

  if v_customer_id is null or v_phone_last10 !~ '^[0-9]{10}$' then
    raise exception 'A valid 10-digit customer mobile number is required before enabling portal login'
      using errcode = '22023';
  end if;

  insert into public.client_portal_access(
    business_id, booking_id, customer_id, project_id, phone_last10,
    pin_hash, is_active, failed_attempts, locked_until,
    pin_updated_at, created_by, updated_at
  ) values (
    v_business_id, p_booking_id, v_customer_id, v_project_id, v_phone_last10,
    crypt(p_pin, gen_salt('bf', 10)), true, 0, null,
    now(), auth.uid(), now()
  )
  on conflict (booking_id) do update set
    customer_id = excluded.customer_id,
    project_id = excluded.project_id,
    phone_last10 = excluded.phone_last10,
    pin_hash = excluded.pin_hash,
    is_active = true,
    failed_attempts = 0,
    locked_until = null,
    pin_updated_at = now(),
    created_by = auth.uid(),
    updated_at = now()
  returning id into v_access_id;

  update public.client_portal_sessions
  set revoked_at = now()
  where access_id = v_access_id and revoked_at is null;

  return jsonb_build_object(
    'ok', true,
    'project_id', v_project_id,
    'phone_last10', v_phone_last10,
    'portal_active', true,
    'message', 'Client portal PIN saved. Share it with the customer privately.'
  );
end;
$$;
revoke all on function public.admin_set_client_portal_pin(uuid,text) from public, anon;
grant execute on function public.admin_set_client_portal_pin(uuid,text) to authenticated;

create or replace function public.admin_toggle_client_portal(
  p_booking_id uuid,
  p_active boolean
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_business_id uuid;
  v_access_id uuid;
begin
  select business_id into v_business_id
  from public.studio_bookings where id = p_booking_id;

  if v_business_id is null then
    raise exception 'Studio project not found' using errcode = 'P0002';
  end if;
  perform public.assert_client_portal_admin(v_business_id);

  select id into v_access_id
  from public.client_portal_access
  where booking_id = p_booking_id;

  if v_access_id is null then
    raise exception 'Generate a customer PIN before activating portal access' using errcode = '22023';
  end if;

  update public.client_portal_access
  set is_active = coalesce(p_active,false), updated_at = now()
  where id = v_access_id;

  if not coalesce(p_active,false) then
    update public.client_portal_sessions
    set revoked_at = now()
    where access_id = v_access_id and revoked_at is null;
  end if;

  return jsonb_build_object('ok',true,'portal_active',coalesce(p_active,false));
end;
$$;
revoke all on function public.admin_toggle_client_portal(uuid,boolean) from public, anon;
grant execute on function public.admin_toggle_client_portal(uuid,boolean) to authenticated;

create or replace function public.admin_update_client_portal_delivery(
  p_booking_id uuid,
  p_drive_link text,
  p_mark_delivered boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_business_id uuid;
  v_host text;
begin
  select business_id into v_business_id
  from public.studio_bookings where id = p_booking_id;

  if v_business_id is null then
    raise exception 'Studio project not found' using errcode = 'P0002';
  end if;
  perform public.assert_client_portal_admin(v_business_id);

  if nullif(btrim(coalesce(p_drive_link,'')), '') is not null then
    if left(lower(btrim(p_drive_link)), 8) <> 'https://' or length(btrim(p_drive_link)) > 2048 then
      raise exception 'Enter a valid HTTPS Google Drive sharing URL' using errcode = '22023';
    end if;
    v_host := lower(split_part(split_part(btrim(p_drive_link), '://', 2), '/', 1));
    v_host := regexp_replace(v_host, '^www[.]', '');
    if v_host not in ('drive.google.com','docs.google.com') then
      raise exception 'Only drive.google.com or docs.google.com links are accepted'
        using errcode = '22023';
    end if;
  end if;

  update public.studio_bookings
  set delivery_link = nullif(btrim(coalesce(p_drive_link,'')), ''),
      status = case
        when coalesce(p_mark_delivered,false) and status <> 'completed' then 'delivered'
        else status
      end,
      updated_at = now()
  where id = p_booking_id;

  return jsonb_build_object(
    'ok',true,
    'delivery_link_saved',nullif(btrim(coalesce(p_drive_link,'')), '') is not null,
    'booking_status_updated',coalesce(p_mark_delivered,false)
  );
end;
$$;
revoke all on function public.admin_update_client_portal_delivery(uuid,text,boolean) from public, anon;
grant execute on function public.admin_update_client_portal_delivery(uuid,text,boolean) to authenticated;

create or replace function public.admin_list_client_portal_queries(p_business_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_result jsonb;
begin
  perform public.assert_client_portal_admin(p_business_id);

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'query_id', cpq.id,
      'project_id', a.project_id,
      'customer_name', c.full_name,
      'phone', c.phone,
      'message', cpq.message,
      'response', cpq.response,
      'status', cpq.status,
      'created_at', cpq.created_at,
      'replied_at', cpq.replied_at
    ) order by cpq.created_at desc
  ), '[]'::jsonb)
  into v_result
  from public.client_portal_queries cpq
  join public.client_portal_access a on a.id = cpq.access_id
  join public.customers c on c.id = a.customer_id
  where a.business_id = p_business_id;

  return v_result;
end;
$$;
revoke all on function public.admin_list_client_portal_queries(uuid) from public, anon;
grant execute on function public.admin_list_client_portal_queries(uuid) to authenticated;

create or replace function public.admin_reply_client_portal_query(
  p_query_id uuid,
  p_response text,
  p_status text default 'replied'
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_business_id uuid;
begin
  select a.business_id into v_business_id
  from public.client_portal_queries q
  join public.client_portal_access a on a.id = q.access_id
  where q.id = p_query_id;

  if v_business_id is null then
    raise exception 'Customer query not found' using errcode = 'P0002';
  end if;
  perform public.assert_client_portal_admin(v_business_id);

  if nullif(btrim(coalesce(p_response,'')), '') is null or length(btrim(p_response)) > 2000 then
    raise exception 'Reply must contain 1–2000 characters' using errcode = '22023';
  end if;
  if p_status not in ('in_progress','replied','closed') then
    raise exception 'Invalid query status' using errcode = '22023';
  end if;

  update public.client_portal_queries
  set response = btrim(p_response),
      status = p_status,
      replied_at = case when p_status in ('replied','closed') then now() else replied_at end,
      updated_at = now()
  where id = p_query_id;

  return jsonb_build_object('ok',true,'status',p_status);
end;
$$;
revoke all on function public.admin_reply_client_portal_query(uuid,text,text) from public, anon;
grant execute on function public.admin_reply_client_portal_query(uuid,text,text) to authenticated;

create or replace function public.client_portal_login(
  p_phone text,
  p_project_id text,
  p_pin text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_access record;
  v_phone_last10 text;
  v_token text;
begin
  v_phone_last10 := right(regexp_replace(coalesce(p_phone,''), '[^0-9]', '', 'g'), 10);

  if v_phone_last10 !~ '^[0-9]{10}$'
     or nullif(upper(btrim(coalesce(p_project_id,''))), '') is null
     or p_pin is null or p_pin !~ '^[0-9]{8}$' then
    return jsonb_build_object('ok',false,'message','Details could not be verified. Check your mobile number, Project ID and PIN.');
  end if;

  select a.id, a.pin_hash, a.is_active, a.failed_attempts, a.locked_until,
         a.phone_last10, a.customer_id, a.booking_id
  into v_access
  from public.client_portal_access a
  join public.studio_bookings sb on sb.id = a.booking_id
  join public.orders o on o.id = sb.order_id
  join public.customers c on c.id = o.customer_id
  where a.business_id = sb.business_id
    and upper(a.project_id) = upper(btrim(p_project_id))
    and sb.business_id = (select id from public.business_units where code='graphix' and is_active=true)
    and a.customer_id = c.id
  for update of a;

  if not found or not v_access.is_active or v_access.phone_last10 <> v_phone_last10 then
    return jsonb_build_object('ok',false,'message','Details could not be verified. Check your mobile number, Project ID and PIN.');
  end if;

  if v_access.locked_until is not null and v_access.locked_until > now() then
    return jsonb_build_object('ok',false,'message','Too many incorrect attempts. Please try again after 10 minutes.');
  end if;

  if crypt(p_pin, v_access.pin_hash) <> v_access.pin_hash then
    update public.client_portal_access
    set failed_attempts = failed_attempts + 1,
        locked_until = case when failed_attempts + 1 >= 5 then now() + interval '10 minutes' else locked_until end,
        updated_at = now()
    where id = v_access.id;

    return jsonb_build_object('ok',false,'message','Details could not be verified. Check your mobile number, Project ID and PIN.');
  end if;

  update public.client_portal_access
  set failed_attempts = 0, locked_until = null, updated_at = now()
  where id = v_access.id;

  v_token := encode(gen_random_bytes(32), 'hex');

  insert into public.client_portal_sessions(token_hash, access_id, expires_at)
  values (encode(digest(v_token, 'sha256'), 'hex'), v_access.id, now() + interval '12 hours');

  return jsonb_build_object(
    'ok',true,
    'access_token',v_token,
    'expires_in_seconds',43200
  );
end;
$$;
revoke all on function public.client_portal_login(text,text,text) from public;
grant execute on function public.client_portal_login(text,text,text) to anon, authenticated;

create or replace function public.client_portal_get_project(p_access_token text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_result jsonb;
begin
  if p_access_token is null or p_access_token !~ '^[a-f0-9]{64}$' then
    raise exception 'Portal session expired. Please sign in again.' using errcode = '28000';
  end if;

  update public.client_portal_sessions
  set last_seen_at = now()
  where token_hash = encode(digest(p_access_token, 'sha256'), 'hex')
    and revoked_at is null and expires_at > now();

  if not found then
    raise exception 'Portal session expired. Please sign in again.' using errcode = '28000';
  end if;

  select jsonb_build_object(
    'project_id', o.order_no,
    'customer_name', c.full_name,
    'event_type', sb.event_type,
    'project_date', sb.starts_at,
    'booking_status', sb.status,
    'delivery_ready', (sb.delivery_link is not null and sb.status in ('delivered','completed')),
    'delivery_link', case when sb.delivery_link is not null and sb.status in ('delivered','completed') then sb.delivery_link else null end
  )
  into v_result
  from public.client_portal_sessions s
  join public.client_portal_access a on a.id = s.access_id and a.is_active = true
  join public.studio_bookings sb on sb.id = a.booking_id
  join public.orders o on o.id = sb.order_id
  join public.customers c on c.id = a.customer_id
  where s.token_hash = encode(digest(p_access_token, 'sha256'), 'hex')
    and s.revoked_at is null and s.expires_at > now();

  if v_result is null then
    raise exception 'Portal access is unavailable. Contact BHARATEE GRAPHIX.' using errcode = '28000';
  end if;
  return v_result;
end;
$$;
revoke all on function public.client_portal_get_project(text) from public;
grant execute on function public.client_portal_get_project(text) to anon, authenticated;

create or replace function public.client_portal_list_queries(p_access_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_access_id uuid;
  v_result jsonb;
begin
  select s.access_id into v_access_id
  from public.client_portal_sessions s
  join public.client_portal_access a on a.id = s.access_id and a.is_active = true
  where s.token_hash = encode(digest(coalesce(p_access_token,''), 'sha256'), 'hex')
    and s.revoked_at is null and s.expires_at > now();

  if v_access_id is null then
    raise exception 'Portal session expired. Please sign in again.' using errcode = '28000';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', q.id, 'message', q.message, 'response', q.response,
    'status', q.status, 'created_at', q.created_at, 'replied_at', q.replied_at
  ) order by q.created_at desc), '[]'::jsonb)
  into v_result
  from public.client_portal_queries q
  where q.access_id = v_access_id;

  return v_result;
end;
$$;
revoke all on function public.client_portal_list_queries(text) from public;
grant execute on function public.client_portal_list_queries(text) to anon, authenticated;

create or replace function public.client_portal_submit_query(
  p_access_token text,
  p_message text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_access_id uuid;
  v_query_id uuid;
begin
  select s.access_id into v_access_id
  from public.client_portal_sessions s
  join public.client_portal_access a on a.id = s.access_id and a.is_active = true
  where s.token_hash = encode(digest(coalesce(p_access_token,''), 'sha256'), 'hex')
    and s.revoked_at is null and s.expires_at > now();

  if v_access_id is null then
    raise exception 'Portal session expired. Please sign in again.' using errcode = '28000';
  end if;

  if char_length(btrim(coalesce(p_message,''))) < 5 or char_length(btrim(p_message)) > 2000 then
    raise exception 'Your message must contain 5–2000 characters' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.client_portal_queries q
    where q.access_id = v_access_id and q.created_at > now() - interval '30 seconds'
  ) then
    raise exception 'Please wait 30 seconds before sending another query' using errcode = '22023';
  end if;

  insert into public.client_portal_queries(access_id, message)
  values (v_access_id, btrim(p_message))
  returning id into v_query_id;

  return jsonb_build_object('ok',true,'query_id',v_query_id);
end;
$$;
revoke all on function public.client_portal_submit_query(text,text) from public;
grant execute on function public.client_portal_submit_query(text,text) to anon, authenticated;

create or replace function public.client_portal_logout(p_access_token text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
begin
  update public.client_portal_sessions
  set revoked_at = now()
  where token_hash = encode(digest(coalesce(p_access_token,''), 'sha256'), 'hex')
    and revoked_at is null;
  return jsonb_build_object('ok',true);
end;
$$;
revoke all on function public.client_portal_logout(text) from public;
grant execute on function public.client_portal_logout(text) to anon, authenticated;

comment on table public.client_portal_access is
  'PIN-hash-only customer access records for BHARATEE GRAPHIX projects. Access is managed through owner-only RPCs.';
comment on table public.client_portal_sessions is
  'Hashed short-lived customer portal sessions. Plain bearer tokens are never stored.';
comment on table public.client_portal_queries is
  'Customer messages and studio responses scoped to a single project portal access record.';
