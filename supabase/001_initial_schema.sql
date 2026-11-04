-- BHARATEE DIGITAL SERVICE + BHARATEE GRAPHIX
-- Initial Supabase/PostgreSQL schema. Apply to a NEW Supabase project first.
-- Review grants/RLS with separate test users before production.
-- This file intentionally contains no real secrets or customer data.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Business units, users and roles
-- ---------------------------------------------------------------------------
create table if not exists public.business_units (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('digital-service', 'graphix')),
  name_i18n jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  preferred_locale text not null default 'en' check (preferred_locale in ('en', 'hi', 'or')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_members (
  user_id uuid not null references public.profiles(id) on delete cascade,
  business_id uuid not null references public.business_units(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'manager', 'cyber_staff', 'studio_staff', 'accountant', 'viewer')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, business_id)
);

create or replace function public.is_any_business_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.business_members bm
    where bm.user_id = auth.uid()
      and bm.is_active = true
      and bm.role in ('owner', 'admin')
  );
$$;

revoke all on function public.is_any_business_admin() from public;
grant execute on function public.is_any_business_admin() to authenticated;

create or replace function public.can_view_staff_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_profile_id = auth.uid() or exists (
    select 1
    from public.business_members mine
    join public.business_members teammate on teammate.business_id = mine.business_id
    where mine.user_id = auth.uid()
      and mine.is_active = true
      and teammate.user_id = p_profile_id
      and teammate.is_active = true
  );
$$;

revoke all on function public.can_view_staff_profile(uuid) from public;
grant execute on function public.can_view_staff_profile(uuid) to authenticated;

create or replace function public.has_business_role(
  p_business_id uuid,
  p_allowed_roles text[]
) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_members bm
    where bm.user_id = auth.uid()
      and bm.business_id = p_business_id
      and bm.is_active = true
      and bm.role = any (p_allowed_roles)
  );
$$;

revoke all on function public.has_business_role(uuid, text[]) from public;
grant execute on function public.has_business_role(uuid, text[]) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Customers, service catalogue and orders
-- ---------------------------------------------------------------------------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  alternate_phone text,
  email text,
  address text,
  preferred_locale text not null default 'en' check (preferred_locale in ('en', 'hi', 'or')),
  whatsapp_opt_in boolean not null default false,
  whatsapp_opt_in_at timestamptz,
  whatsapp_opt_in_source text,
  whatsapp_opt_out_at timestamptz,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not whatsapp_opt_in or whatsapp_opt_in_at is not null)
);

create table if not exists public.customer_business_links (
  customer_id uuid not null references public.customers(id) on delete cascade,
  business_id uuid not null references public.business_units(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  primary key (customer_id, business_id)
);

create table if not exists public.service_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_units(id) on delete cascade,
  name_i18n jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_catalog (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_units(id) on delete cascade,
  category_id uuid references public.service_categories(id) on delete set null,
  service_code text,
  name_i18n jsonb not null default '{}'::jsonb,
  description_i18n jsonb not null default '{}'::jsonb,
  unit_label_i18n jsonb not null default '{}'::jsonb,
  base_price numeric(12,2) not null default 0 check (base_price >= 0),
  is_active boolean not null default true,
  is_public boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, service_code)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_units(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete set null,
  order_no text not null,
  order_type text not null check (order_type in ('counter', 'printing', 'photocopy', 'scan', 'lamination', 'passport_photo', 'photo_frame', 'photo_editing', 'photography', 'videography', 'wedding', 'other')),
  status text not null default 'received' check (status in ('received', 'in_progress', 'ready', 'delivered', 'cancelled', 'on_hold')),
  due_at timestamptz,
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, order_no),
  check (discount <= subtotal)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  service_id uuid references public.service_catalog(id) on delete set null,
  description text not null,
  quantity numeric(12,3) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  line_total numeric(12,2) generated always as (round(quantity * unit_price, 2)) stored,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. Studio packages, enquiries and bookings
-- ---------------------------------------------------------------------------
create table if not exists public.studio_packages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_units(id) on delete cascade,
  package_code text,
  name_i18n jsonb not null default '{}'::jsonb,
  description_i18n jsonb not null default '{}'::jsonb,
  inclusions_i18n jsonb not null default '[]'::jsonb,
  base_price numeric(12,2) not null default 0 check (base_price >= 0),
  is_active boolean not null default true,
  is_public boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, package_code)
);

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_units(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  phone text not null,
  email text,
  preferred_locale text not null default 'en' check (preferred_locale in ('en', 'hi', 'or')),
  enquiry_type text not null default 'general',
  source text not null default 'website' check (source in ('website', 'whatsapp', 'phone', 'walk_in', 'social', 'other')),
  message text,
  preferred_event_at timestamptz,
  status text not null default 'new' check (status in ('new', 'contacted', 'quoted', 'converted', 'closed', 'spam')),
  whatsapp_contact_requested boolean not null default false,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_units(id) on delete restrict,
  order_id uuid not null unique references public.orders(id) on delete restrict,
  enquiry_id uuid references public.enquiries(id) on delete set null,
  package_id uuid references public.studio_packages(id) on delete set null,
  event_type text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  venue_name text,
  venue_address text,
  city text,
  status text not null default 'tentative' check (status in ('enquiry', 'quoted', 'tentative', 'confirmed', 'in_progress', 'editing', 'review', 'delivered', 'completed', 'cancelled')),
  referral_source text,
  shoot_notes text,
  delivery_link text,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

-- ---------------------------------------------------------------------------
-- 4. Payments, expenses and cash reconciliation
-- ---------------------------------------------------------------------------
create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_units(id) on delete restrict,
  order_id uuid not null references public.orders(id) on delete restrict,
  entry_type text not null check (entry_type in ('receipt', 'refund')),
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null check (payment_method in ('cash', 'upi', 'bank_transfer', 'card', 'other')),
  reference_no text,
  transaction_at timestamptz not null default now(),
  note text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_units(id) on delete cascade,
  name_i18n jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, name_i18n)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_units(id) on delete restrict,
  category_id uuid references public.expense_categories(id) on delete set null,
  expense_date timestamptz not null default now(),
  description text not null,
  vendor_name text,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null check (payment_method in ('cash', 'upi', 'bank_transfer', 'card', 'other')),
  receipt_object_path text,
  note text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_units(id) on delete restrict,
  opened_by uuid not null references public.profiles(id) on delete restrict,
  opened_at timestamptz not null default now(),
  opening_cash numeric(12,2) not null default 0 check (opening_cash >= 0),
  closed_by uuid references public.profiles(id) on delete set null,
  closed_at timestamptz,
  counted_cash numeric(12,2) check (counted_cash >= 0),
  expected_cash numeric(12,2),
  variance numeric(12,2),
  closing_note text,
  created_at timestamptz not null default now(),
  check ((closed_at is null and closed_by is null) or (closed_at is not null and closed_by is not null))
);

-- ---------------------------------------------------------------------------
-- 5. Website CMS, government directory, media and translations
-- ---------------------------------------------------------------------------
create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_units(id) on delete cascade,
  page_key text not null,
  section_key text not null,
  locale text not null check (locale in ('en', 'hi', 'or')),
  content jsonb not null default '{}'::jsonb,
  is_published boolean not null default false,
  published_at timestamptz,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, page_key, section_key, locale)
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_units(id) on delete cascade,
  setting_key text not null,
  setting_value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (business_id, setting_key)
);

create table if not exists public.government_services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_units(id) on delete cascade,
  category_key text not null,
  name_i18n jsonb not null default '{}'::jsonb,
  description_i18n jsonb not null default '{}'::jsonb,
  required_documents_i18n jsonb not null default '[]'::jsonb,
  official_url text not null,
  assistance_notes_i18n jsonb not null default '{}'::jsonb,
  last_verified_at date,
  is_active boolean not null default true,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (official_url ~ '^https://')
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_units(id) on delete cascade,
  storage_bucket text not null,
  object_path text not null,
  media_type text not null check (media_type in ('image', 'video', 'document', 'other')),
  mime_type text,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  width integer,
  height integer,
  alt_text_i18n jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (storage_bucket, object_path)
);

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_units(id) on delete cascade,
  media_asset_id uuid not null references public.media_assets(id) on delete restrict,
  category_key text not null default 'general',
  title_i18n jsonb not null default '{}'::jsonb,
  caption_i18n jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ui_translations (
  id uuid primary key default gen_random_uuid(),
  translation_key text not null,
  locale text not null check (locale in ('en', 'hi', 'or')),
  translation_value text not null,
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (translation_key, locale)
);

-- ---------------------------------------------------------------------------
-- 6. WhatsApp, notifications and audit
-- ---------------------------------------------------------------------------
create table if not exists public.whatsapp_message_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_units(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  direction text not null check (direction in ('inbound', 'outbound')),
  template_name text,
  provider_message_id text unique,
  status text not null default 'queued' check (status in ('queued', 'sent', 'delivered', 'read', 'failed', 'received')),
  recipient_phone text not null,
  status_detail text,
  sent_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  status_updated_at timestamptz
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.business_units(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title_i18n jsonb not null default '{}'::jsonb,
  body_i18n jsonb not null default '{}'::jsonb,
  link_path text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id bigint generated always as identity primary key,
  business_id uuid references public.business_units(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 7. Indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_business_members_user on public.business_members(user_id, is_active);
create index if not exists idx_customers_phone on public.customers(phone);
create index if not exists idx_customer_business_links_business on public.customer_business_links(business_id, customer_id);
create index if not exists idx_customers_name on public.customers using gin (to_tsvector('simple', full_name));
create index if not exists idx_service_catalog_business on public.service_catalog(business_id, is_active, sort_order);
create index if not exists idx_orders_business_created on public.orders(business_id, created_at desc);
create index if not exists idx_orders_status_due on public.orders(business_id, status, due_at);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_enquiries_queue on public.enquiries(business_id, status, created_at desc);
create index if not exists idx_studio_bookings_calendar on public.studio_bookings(business_id, starts_at, ends_at, status);
create index if not exists idx_payments_business_date on public.payment_transactions(business_id, transaction_at desc);
create index if not exists idx_payments_order on public.payment_transactions(order_id, transaction_at);
create index if not exists idx_expenses_business_date on public.expenses(business_id, expense_date desc);
create index if not exists idx_site_content_public on public.site_content(business_id, page_key, is_published, locale);
create index if not exists idx_government_services_public on public.government_services(business_id, is_published, category_key, sort_order);
create index if not exists idx_gallery_public on public.gallery_items(business_id, is_published, category_key, sort_order);
create index if not exists idx_whatsapp_status on public.whatsapp_message_logs(business_id, status, created_at desc);
create index if not exists idx_notifications_user on public.notifications(user_id, read_at, created_at desc);
create index if not exists idx_activity_business on public.activity_logs(business_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 8. updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'business_units', 'profiles', 'customers', 'service_categories', 'service_catalog',
    'orders', 'studio_packages', 'enquiries', 'studio_bookings', 'expenses',
    'site_content', 'site_settings', 'government_services', 'gallery_items', 'ui_translations'
  ] loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', tbl, tbl);
    execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', tbl, tbl);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 9. Row Level Security
-- ---------------------------------------------------------------------------
alter table public.business_units enable row level security;
alter table public.profiles enable row level security;
alter table public.business_members enable row level security;
alter table public.customers enable row level security;
alter table public.customer_business_links enable row level security;
alter table public.service_categories enable row level security;
alter table public.service_catalog enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.studio_packages enable row level security;
alter table public.enquiries enable row level security;
alter table public.studio_bookings enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;
alter table public.cash_sessions enable row level security;
alter table public.site_content enable row level security;
alter table public.site_settings enable row level security;
alter table public.government_services enable row level security;
alter table public.media_assets enable row level security;
alter table public.gallery_items enable row level security;
alter table public.ui_translations enable row level security;
alter table public.whatsapp_message_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_logs enable row level security;

-- Public read: published website data only.
create policy business_units_public_read on public.business_units
  for select to anon, authenticated using (is_active = true);

create policy service_catalog_public_read on public.service_catalog
  for select to anon, authenticated using (is_active = true and is_public = true);
create policy service_catalog_staff_read on public.service_catalog
  for select to authenticated
  using (public.has_business_role(business_id, array['owner','admin','manager','cyber_staff','studio_staff','accountant']));
create policy service_catalog_staff_manage on public.service_catalog
  for all to authenticated
  using (public.has_business_role(business_id, array['owner','admin','manager']))
  with check (public.has_business_role(business_id, array['owner','admin','manager']));

create policy studio_packages_public_read on public.studio_packages
  for select to anon, authenticated using (is_active = true and is_public = true);
create policy studio_packages_staff_read on public.studio_packages
  for select to authenticated
  using (public.has_business_role(business_id, array['owner','admin','manager','studio_staff']));
create policy studio_packages_staff_manage on public.studio_packages
  for all to authenticated
  using (public.has_business_role(business_id, array['owner','admin','manager']))
  with check (public.has_business_role(business_id, array['owner','admin','manager']));

create policy site_content_public_read on public.site_content
  for select to anon, authenticated using (is_published = true);
create policy site_content_staff_manage on public.site_content
  for all to authenticated
  using (public.has_business_role(business_id, array['owner','admin','manager']))
  with check (public.has_business_role(business_id, array['owner','admin','manager']));

create policy site_settings_public_read on public.site_settings
  for select to anon, authenticated using (is_public = true);
create policy site_settings_staff_manage on public.site_settings
  for all to authenticated
  using (public.has_business_role(business_id, array['owner','admin']))
  with check (public.has_business_role(business_id, array['owner','admin']));

create policy government_services_public_read on public.government_services
  for select to anon, authenticated using (is_active = true and is_published = true);
create policy government_services_staff_manage on public.government_services
  for all to authenticated
  using (public.has_business_role(business_id, array['owner','admin','manager']))
  with check (public.has_business_role(business_id, array['owner','admin','manager']));

create policy media_assets_public_read on public.media_assets
  for select to anon, authenticated using (is_public = true);
create policy media_assets_staff_manage on public.media_assets
  for all to authenticated
  using (public.has_business_role(business_id, array['owner','admin','manager','studio_staff']))
  with check (public.has_business_role(business_id, array['owner','admin','manager','studio_staff']));

create policy gallery_items_public_read on public.gallery_items
  for select to anon, authenticated using (is_published = true);
create policy gallery_items_staff_manage on public.gallery_items
  for all to authenticated
  using (public.has_business_role(business_id, array['owner','admin','manager','studio_staff']))
  with check (public.has_business_role(business_id, array['owner','admin','manager','studio_staff']));

create policy ui_translations_public_read on public.ui_translations
  for select to anon, authenticated using (is_active = true);
create policy ui_translations_admin_manage on public.ui_translations
  for all to authenticated
  using (public.is_any_business_admin())
  with check (public.is_any_business_admin());

-- Staff and financial records. No anonymous policies are granted.
create policy business_members_self_read on public.business_members
  for select to authenticated using (user_id = auth.uid() or public.has_business_role(business_id, array['owner','admin']));
-- Role assignments are changed only through a trusted owner-authorized server function.

create policy profiles_team_read on public.profiles
  for select to authenticated using (public.can_view_staff_profile(id));
create policy profiles_self_update on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_self_insert on public.profiles
  for insert to authenticated with check (id = auth.uid());

create policy customer_business_links_staff_read on public.customer_business_links
  for select to authenticated
  using (public.has_business_role(business_id, array['owner','admin','manager','cyber_staff','studio_staff','accountant']));
-- Create/link customers through a trusted function so the customer row and the
-- business access link are created atomically and cannot be cross-linked freely.

create policy customers_linked_staff_read on public.customers
  for select to authenticated
  using (exists (
    select 1 from public.customer_business_links cbl
    where cbl.customer_id = id
      and public.has_business_role(cbl.business_id, array['owner','admin','manager','cyber_staff','studio_staff','accountant'])
  ));
create policy customers_staff_update on public.customers
  for update to authenticated
  using (exists (
    select 1 from public.customer_business_links cbl
    where cbl.customer_id = id
      and public.has_business_role(cbl.business_id, array['owner','admin','manager','cyber_staff','studio_staff'])
  ))
  with check (exists (
    select 1 from public.customer_business_links cbl
    where cbl.customer_id = id
      and public.has_business_role(cbl.business_id, array['owner','admin','manager','cyber_staff','studio_staff'])
  ));

create policy service_categories_staff_read on public.service_categories
  for select to authenticated
  using (public.has_business_role(business_id, array['owner','admin','manager','cyber_staff','studio_staff','accountant']));
create policy service_categories_staff_manage on public.service_categories
  for all to authenticated
  using (public.has_business_role(business_id, array['owner','admin','manager']))
  with check (public.has_business_role(business_id, array['owner','admin','manager']));

create policy orders_staff_read on public.orders
  for select to authenticated
  using (public.has_business_role(business_id, array['owner','admin','manager','cyber_staff','studio_staff','accountant']));
create policy orders_staff_insert on public.orders
  for insert to authenticated
  with check (public.has_business_role(business_id, array['owner','admin','manager','cyber_staff','studio_staff']));
create policy orders_staff_update on public.orders
  for update to authenticated
  using (public.has_business_role(business_id, array['owner','admin','manager','cyber_staff','studio_staff']))
  with check (public.has_business_role(business_id, array['owner','admin','manager','cyber_staff','studio_staff']));

create policy order_items_staff_read on public.order_items
  for select to authenticated
  using (exists (
    select 1 from public.orders o where o.id = order_id
      and public.has_business_role(o.business_id, array['owner','admin','manager','cyber_staff','studio_staff','accountant'])
  ));
create policy order_items_staff_insert on public.order_items
  for insert to authenticated
  with check (exists (
    select 1 from public.orders o where o.id = order_id
      and public.has_business_role(o.business_id, array['owner','admin','manager','cyber_staff','studio_staff'])
  ));
create policy order_items_staff_update on public.order_items
  for update to authenticated
  using (exists (
    select 1 from public.orders o where o.id = order_id
      and public.has_business_role(o.business_id, array['owner','admin','manager','cyber_staff','studio_staff'])
  ))
  with check (exists (
    select 1 from public.orders o where o.id = order_id
      and public.has_business_role(o.business_id, array['owner','admin','manager','cyber_staff','studio_staff'])
  ));

create policy enquiries_staff_read on public.enquiries
  for select to authenticated
  using (public.has_business_role(business_id, array['owner','admin','manager','cyber_staff','studio_staff']));
create policy enquiries_staff_insert on public.enquiries
  for insert to authenticated
  with check (public.has_business_role(business_id, array['owner','admin','manager','cyber_staff','studio_staff']));
create policy enquiries_staff_update on public.enquiries
  for update to authenticated
  using (public.has_business_role(business_id, array['owner','admin','manager','cyber_staff','studio_staff']))
  with check (public.has_business_role(business_id, array['owner','admin','manager','cyber_staff','studio_staff']));

create policy studio_bookings_staff_read on public.studio_bookings
  for select to authenticated
  using (public.has_business_role(business_id, array['owner','admin','manager','studio_staff']));
create policy studio_bookings_staff_insert on public.studio_bookings
  for insert to authenticated
  with check (public.has_business_role(business_id, array['owner','admin','manager','studio_staff']));
create policy studio_bookings_staff_update on public.studio_bookings
  for update to authenticated
  using (public.has_business_role(business_id, array['owner','admin','manager','studio_staff']))
  with check (public.has_business_role(business_id, array['owner','admin','manager','studio_staff']));

create policy payments_finance_read on public.payment_transactions
  for select to authenticated
  using (public.has_business_role(business_id, array['owner','admin','manager','accountant']));
create policy payments_finance_insert on public.payment_transactions
  for insert to authenticated
  with check (public.has_business_role(business_id, array['owner','admin','manager','accountant']));
-- Receipts/refunds are append-only: no ordinary UPDATE/DELETE policy is provided.

create policy expense_categories_finance_access on public.expense_categories
  for all to authenticated
  using (public.has_business_role(business_id, array['owner','admin','manager','accountant']))
  with check (public.has_business_role(business_id, array['owner','admin','manager','accountant']));

create policy expenses_finance_read on public.expenses
  for select to authenticated
  using (public.has_business_role(business_id, array['owner','admin','manager','accountant']));
create policy expenses_finance_insert on public.expenses
  for insert to authenticated
  with check (public.has_business_role(business_id, array['owner','admin','manager','accountant']));
create policy expenses_finance_update on public.expenses
  for update to authenticated
  using (public.has_business_role(business_id, array['owner','admin','manager','accountant']))
  with check (public.has_business_role(business_id, array['owner','admin','manager','accountant']));

create policy cash_sessions_finance_read on public.cash_sessions
  for select to authenticated
  using (public.has_business_role(business_id, array['owner','admin','manager','accountant']));
create policy cash_sessions_finance_insert on public.cash_sessions
  for insert to authenticated
  with check (public.has_business_role(business_id, array['owner','admin','manager','accountant']));
create policy cash_sessions_finance_update on public.cash_sessions
  for update to authenticated
  using (public.has_business_role(business_id, array['owner','admin','manager','accountant']))
  with check (public.has_business_role(business_id, array['owner','admin','manager','accountant']));

create policy whatsapp_logs_manager_access on public.whatsapp_message_logs
  for select to authenticated
  using (public.has_business_role(business_id, array['owner','admin','manager']));

create policy notifications_owner_read_update on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy notifications_owner_update on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy activity_logs_admin_read on public.activity_logs
  for select to authenticated
  using (business_id is not null and public.has_business_role(business_id, array['owner','admin']));

-- ---------------------------------------------------------------------------
-- 10. Explicit grants. RLS policies still decide which rows are visible.
-- ---------------------------------------------------------------------------
grant select on public.business_units to anon, authenticated;
grant select on public.business_members, public.customer_business_links to authenticated;
grant select on public.service_catalog, public.studio_packages, public.site_content,
  public.site_settings, public.government_services, public.media_assets,
  public.gallery_items, public.ui_translations to anon, authenticated;

grant select, insert, update, delete on public.profiles,
  public.customers, public.service_categories, public.service_catalog, public.orders,
  public.order_items, public.studio_packages, public.enquiries, public.studio_bookings,
  public.payment_transactions, public.expense_categories, public.expenses,
  public.cash_sessions, public.site_content, public.site_settings,
  public.government_services, public.media_assets, public.gallery_items,
  public.ui_translations, public.whatsapp_message_logs, public.notifications,
  public.activity_logs to authenticated;

grant usage, select on sequence public.activity_logs_id_seq to authenticated;

-- ---------------------------------------------------------------------------
-- 11. Initial business-unit records
-- ---------------------------------------------------------------------------
insert into public.business_units (code, name_i18n)
values
  ('digital-service', '{"en":"BHARATEE DIGITAL SERVICE","hi":"BHARATEE DIGITAL SERVICE","or":"BHARATEE DIGITAL SERVICE"}'::jsonb),
  ('graphix', '{"en":"BHARATEE GRAPHIX","hi":"BHARATEE GRAPHIX","or":"BHARATEE GRAPHIX"}'::jsonb)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Production implementation notes (not automatic in this schema):
-- 1. Create Auth users through Supabase Auth invitation/admin flow, then create
--    their profiles and business_members rows using a trusted admin operation.
-- 2. Add Storage bucket policies for public-site-media and private-business-files.
-- 3. Public enquiry submissions must go through a rate-limited Edge Function;
--    do not grant anonymous INSERT on enquiries/customers/orders.
-- 4. Implement booking conflict checks and order/payment totals in trusted
--    server-side transactions/RPCs. Do not trust browser-calculated totals.
-- 5. Add automated tests for every RLS policy using separate test accounts.
-- 6. Customer creation and customer_business_links assignment must be performed
--    atomically by a trusted Edge Function/RPC after checking staff membership.
-- 7. Review all policies/grants before production; this is a foundation schema,
--    not a substitute for deployment-specific security review.
