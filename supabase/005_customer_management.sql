-- BHARATEE BUSINESS PLATFORM
-- Migration 005: business-scoped customer directory, create/update and search.
-- Run ONCE after migrations 001, 003 and 004 have been installed.
-- The search RPC is SECURITY INVOKER so existing RLS remains in force.
-- The save RPC is SECURITY DEFINER only to atomically create/link a customer;
-- it performs explicit authentication, active-profile and business-role checks.

create index if not exists idx_orders_business_customer_created
  on public.orders (business_id, customer_id, created_at desc)
  where customer_id is not null;

create index if not exists idx_enquiries_business_customer_created
  on public.enquiries (business_id, customer_id, created_at desc)
  where customer_id is not null;

create index if not exists idx_customer_links_business_customer
  on public.customer_business_links (business_id, customer_id);

-- Search only customers linked to the selected business. RLS on customers,
-- customer_business_links and orders still filters rows for the signed-in user.
create or replace function public.search_business_customers(
  p_business_id uuid,
  p_search text default null,
  p_limit integer default 100
)
returns table (
  customer_id uuid,
  full_name text,
  phone text,
  alternate_phone text,
  email text,
  address text,
  preferred_locale text,
  whatsapp_opt_in boolean,
  notes text,
  created_at timestamptz,
  updated_at timestamptz,
  order_count bigint,
  last_order_at timestamptz
)
language sql
stable
security invoker
set search_path = pg_catalog, public, pg_temp
as $$
  select
    c.id,
    c.full_name,
    c.phone,
    c.alternate_phone,
    c.email,
    c.address,
    c.preferred_locale,
    c.whatsapp_opt_in,
    c.notes,
    c.created_at,
    c.updated_at,
    coalesce(order_stats.order_count, 0)::bigint,
    order_stats.last_order_at
  from public.customer_business_links cbl
  join public.customers c on c.id = cbl.customer_id
  left join lateral (
    select count(*)::bigint as order_count, max(o.created_at) as last_order_at
    from public.orders o
    where o.business_id = p_business_id
      and o.customer_id = c.id
  ) order_stats on true
  where cbl.business_id = p_business_id
    and (
      nullif(btrim(coalesce(p_search, '')), '') is null
      or c.full_name ilike '%' || btrim(p_search) || '%'
      or coalesce(c.phone, '') ilike '%' || btrim(p_search) || '%'
      or coalesce(c.alternate_phone, '') ilike '%' || btrim(p_search) || '%'
      or coalesce(c.email, '') ilike '%' || btrim(p_search) || '%'
    )
  order by c.updated_at desc, c.full_name asc
  limit greatest(1, least(coalesce(p_limit, 100), 200));
$$;

revoke all on function public.search_business_customers(uuid, text, integer)
  from public, anon;
grant execute on function public.search_business_customers(uuid, text, integer)
  to authenticated;

-- Create or update a customer and link them to exactly the selected business.
-- A duplicate phone number in the same business is returned to the UI rather
-- than silently creating a second record or overwriting an existing customer.
create or replace function public.save_business_customer(
  p_business_id uuid,
  p_customer_id uuid default null,
  p_full_name text default null,
  p_phone text default null,
  p_alternate_phone text default null,
  p_email text default null,
  p_address text default null,
  p_preferred_locale text default 'en',
  p_whatsapp_opt_in boolean default false,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_role text;
  v_customer_id uuid;
  v_duplicate_id uuid;
  v_full_name text;
  v_phone text;
  v_phone_digits text;
  v_alt_phone text;
  v_alt_digits text;
  v_email text;
  v_address text;
  v_locale text;
  v_notes text;
  v_created boolean := false;
  v_was_opted_in boolean := false;
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
  where bm.user_id = auth.uid()
    and bm.business_id = p_business_id
    and bm.is_active = true;

  if v_role is null or v_role not in ('owner', 'admin', 'manager', 'cyber_staff', 'studio_staff') then
    raise exception 'You do not have permission to create or edit customers in this business'
      using errcode = '42501';
  end if;

  if not exists (select 1 from public.business_units bu where bu.id = p_business_id and bu.is_active = true) then
    raise exception 'Business unit not found or inactive' using errcode = '22023';
  end if;

  v_full_name := left(btrim(coalesce(p_full_name, '')), 120);
  if length(v_full_name) < 2 then
    raise exception 'Customer name must contain at least 2 characters' using errcode = '22023';
  end if;

  v_phone := nullif(left(btrim(coalesce(p_phone, '')), 32), '');
  v_phone_digits := regexp_replace(coalesce(v_phone, ''), '[^0-9]', '', 'g');
  if v_phone is not null and length(v_phone_digits) not between 7 and 15 then
    raise exception 'Enter a valid phone number with 7 to 15 digits' using errcode = '22023';
  end if;

  v_alt_phone := nullif(left(btrim(coalesce(p_alternate_phone, '')), 32), '');
  v_alt_digits := regexp_replace(coalesce(v_alt_phone, ''), '[^0-9]', '', 'g');
  if v_alt_phone is not null and length(v_alt_digits) not between 7 and 15 then
    raise exception 'Enter a valid alternate phone number with 7 to 15 digits' using errcode = '22023';
  end if;

  v_email := nullif(lower(btrim(coalesce(p_email, ''))), '');
  if v_email is not null and (length(v_email) > 254 or position('@' in v_email) < 2 or position('.' in split_part(v_email, '@', 2)) < 2) then
    raise exception 'Enter a valid email address' using errcode = '22023';
  end if;

  v_address := nullif(left(btrim(coalesce(p_address, '')), 500), '');
  v_notes := nullif(left(btrim(coalesce(p_notes, '')), 2000), '');
  v_locale := coalesce(nullif(p_preferred_locale, ''), 'en');
  if v_locale not in ('en', 'hi', 'or') then
    raise exception 'Preferred language must be English, Hindi or Odia' using errcode = '22023';
  end if;

  if coalesce(p_whatsapp_opt_in, false) and v_phone is null then
    raise exception 'A phone number is required before recording WhatsApp consent' using errcode = '22023';
  end if;

  if v_phone_digits <> '' then
    perform pg_advisory_xact_lock(hashtextextended(p_business_id::text || ':' || v_phone_digits, 0));
  end if;

  if p_customer_id is null then
    if v_phone_digits <> '' then
      select c.id into v_duplicate_id
      from public.customers c
      join public.customer_business_links cbl on cbl.customer_id = c.id
      where cbl.business_id = p_business_id
        and regexp_replace(coalesce(c.phone, ''), '[^0-9]', '', 'g') = v_phone_digits
      order by c.updated_at desc
      limit 1;

      if v_duplicate_id is not null then
        return jsonb_build_object(
          'duplicate', true,
          'customer_id', v_duplicate_id,
          'message', 'A customer with this phone number already exists in this business.'
        );
      end if;
    end if;

    insert into public.customers (
      full_name, phone, alternate_phone, email, address,
      preferred_locale, whatsapp_opt_in, whatsapp_opt_in_at,
      whatsapp_opt_in_source, notes, created_by
    ) values (
      v_full_name, v_phone, v_alt_phone, v_email, v_address,
      v_locale, coalesce(p_whatsapp_opt_in, false),
      case when coalesce(p_whatsapp_opt_in, false) then now() else null end,
      case when coalesce(p_whatsapp_opt_in, false) then 'admin_customer_manager' else null end,
      v_notes, auth.uid()
    ) returning id into v_customer_id;

    insert into public.customer_business_links (customer_id, business_id, created_by)
    values (v_customer_id, p_business_id, auth.uid());
    v_created := true;
  else
    select c.id, c.whatsapp_opt_in
      into v_customer_id, v_was_opted_in
    from public.customers c
    join public.customer_business_links cbl on cbl.customer_id = c.id
    where c.id = p_customer_id and cbl.business_id = p_business_id
    for update of c;

    if v_customer_id is null then
      raise exception 'Customer does not belong to this business' using errcode = '42501';
    end if;

    if v_phone_digits <> '' then
      select c.id into v_duplicate_id
      from public.customers c
      join public.customer_business_links cbl on cbl.customer_id = c.id
      where cbl.business_id = p_business_id
        and c.id <> p_customer_id
        and regexp_replace(coalesce(c.phone, ''), '[^0-9]', '', 'g') = v_phone_digits
      limit 1;
      if v_duplicate_id is not null then
        raise exception 'This phone number is already assigned to another customer in this business'
          using errcode = '23505';
      end if;
    end if;

    update public.customers
    set full_name = v_full_name,
        phone = v_phone,
        alternate_phone = v_alt_phone,
        email = v_email,
        address = v_address,
        preferred_locale = v_locale,
        whatsapp_opt_in = coalesce(p_whatsapp_opt_in, false),
        whatsapp_opt_in_at = case
          when coalesce(p_whatsapp_opt_in, false) then case when v_was_opted_in then whatsapp_opt_in_at else now() end
          else null
        end,
        whatsapp_opt_in_source = case when coalesce(p_whatsapp_opt_in, false) then 'admin_customer_manager' else null end,
        whatsapp_opt_out_at = case
          when not coalesce(p_whatsapp_opt_in, false) and v_was_opted_in then now()
          when coalesce(p_whatsapp_opt_in, false) then null
          else whatsapp_opt_out_at
        end,
        notes = v_notes,
        updated_at = now()
    where id = p_customer_id;
  end if;

  insert into public.activity_logs (business_id, actor_id, action, entity_type, entity_id, metadata)
  values (
    p_business_id,
    auth.uid(),
    case when v_created then 'customer_created' else 'customer_updated' end,
    'customer',
    v_customer_id::text,
    jsonb_build_object('source', 'admin_customer_manager')
  );

  return jsonb_build_object(
    'duplicate', false,
    'created', v_created,
    'customer_id', v_customer_id
  );
end;
$$;

revoke all on function public.save_business_customer(uuid, uuid, text, text, text, text, text, text, boolean, text)
  from public, anon;
grant execute on function public.save_business_customer(uuid, uuid, text, text, text, text, text, text, boolean, text)
  to authenticated;

-- Verify after applying:
-- select * from public.search_business_customers('<business-uuid>'::uuid, null, 20);
-- Never test this function with another business UUID unless the signed-in
-- account has an active membership for that business.
