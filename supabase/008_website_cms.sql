-- BHARATEE BUSINESS PLATFORM
-- Migration 008: Website CMS defaults and supporting indexes.
-- Apply after base schema 001 and prior business migrations 003-007.
-- Safe to run once; seed inserts do not overwrite existing CMS edits.
-- Existing RLS policies from migration 001 protect these CMS tables.

begin;

-- Helpful indexes for the admin CMS and public website reader.
create index if not exists idx_site_content_cms_lookup
  on public.site_content (business_id, page_key, section_key, locale, is_published);

create index if not exists idx_services_cms_sort
  on public.government_services (business_id, is_active, is_published, sort_order);

create index if not exists idx_catalog_cms_public_sort
  on public.service_catalog (business_id, is_active, is_public, sort_order);

create index if not exists idx_gallery_cms_public_sort
  on public.gallery_items (business_id, is_published, category_key, sort_order);

-- Seed the current BHARATEE DIGITAL SERVICE homepage copy as published English
-- CMS records. Public website keeps its existing HTML as fallback; these values
-- mirror that content so the CMS can edit it without redesigning the page.
insert into public.site_content
  (business_id, page_key, section_key, locale, content, is_published, published_at)
select bu.id, 'home', seed.section_key, 'en', seed.content, true, now()
from public.business_units bu
cross join (values
  ('hero', jsonb_build_object(
    'eyebrow', 'Open Daily · Your Local Digital Seva Kendra',
    'headline', E'Aadhaar to Passport,\nPrints to Portraits —\nSab Kuch Ek Jagah.',
    'description', 'BHARATEE DIGITAL SERVICE is your one-stop counter for government e-services, document printing, and photo studio work — all under one roof.'
  )),
  ('govt', jsonb_build_object(
    'eyebrow', 'One-Click Dashboard',
    'title', 'Every government service, one counter.',
    'description', 'Tap a tile to open the official portal directly. We help you fill and submit — right here at the counter.',
    'disclaimer', 'These are official government portals, opened directly in a new tab. BHARATEE DIGITAL SERVICE is not affiliated with UIDAI, ECI, Government of India or the Government of Odisha — we simply help you fill and submit these forms at our counter for a small service charge.'
  )),
  ('services', jsonb_build_object(
    'eyebrow', 'What We Do',
    'title', 'Two counters, one shop.',
    'description', 'Left side runs on bandwidth. Right side runs on light. Both open till 9pm.',
    'cyber_title', 'Cyber Café',
    'studio_title', 'Photo Studio'
  )),
  ('gallery', jsonb_build_object(
    'eyebrow', 'Studio Work',
    'title', 'A shelf of frames.',
    'description', 'A sample of the work that leaves this studio — swap these in for your own portfolio shots.'
  )),
  ('rates', jsonb_build_object(
    'eyebrow', 'Rate Card',
    'title', 'Straight prices, no counter guessing.',
    'description', 'Everything priced at the counter, nothing hidden. Bulk printing and event bookings quoted separately.',
    'note', 'Prices may change; please confirm at the counter.'
  )),
  ('visit', jsonb_build_object(
    'eyebrow', 'Visit',
    'title', 'Find the counter.',
    'description', 'Walk-ins welcome for printing, photos and govt. form filling. Studio sittings and events by appointment.'
  ))
) as seed(section_key, content)
where bu.code = 'digital-service'
on conflict (business_id, page_key, section_key, locale) do nothing;

-- Seed the existing published government portal directory. The Bhulekh URL
-- corrects an obvious duplicated-scheme typo in the old static href.
insert into public.government_services
  (business_id, category_key, name_i18n, description_i18n, required_documents_i18n,
   official_url, assistance_notes_i18n, is_active, is_published, sort_order)
select bu.id, seed.category_key, seed.name_i18n, seed.description_i18n,
       '[]'::jsonb, seed.official_url, '{}'::jsonb, true, true, seed.sort_order
from public.business_units bu
cross join (values
  ('identity', '{"en":"Aadhaar (UIDAI)"}'::jsonb, '{"en":"Update, download or verify your Aadhaar card."}'::jsonb, 'https://uidai.gov.in', 10),
  ('tax', '{"en":"PAN & Income Tax"}'::jsonb, '{"en":"Apply for PAN, file returns, check refund status."}'::jsonb, 'https://www.incometax.gov.in', 20),
  ('land', '{"en":"Bhulekh"}'::jsonb, '{"en":"ROR view, land records and revenue services."}'::jsonb, 'https://bhulekh.ori.nic.in/', 30),
  ('identity', '{"en":"Voter ID (ECI)"}'::jsonb, '{"en":"New registration, correction and e-EPIC download."}'::jsonb, 'https://voters.eci.gov.in', 40),
  ('documents', '{"en":"DigiLocker"}'::jsonb, '{"en":"Store and fetch verified digital documents."}'::jsonb, 'https://www.digilocker.gov.in', 50),
  ('agriculture', '{"en":"PM-KISAN"}'::jsonb, '{"en":"Farmer registration and installment status."}'::jsonb, 'https://pmkisan.gov.in', 60),
  ('labour', '{"en":"e-Shram Card"}'::jsonb, '{"en":"Register unorganised workers and access UAN services."}'::jsonb, 'https://eshram.gov.in', 70),
  ('transport', '{"en":"Parivahan"}'::jsonb, '{"en":"Driving licence, RC and vehicle related services."}'::jsonb, 'https://parivahan.gov.in', 80),
  ('services', '{"en":"UMANG"}'::jsonb, '{"en":"Unified access to central and state services."}'::jsonb, 'https://web.umang.gov.in', 90),
  ('education', '{"en":"Student Academic Management System"}'::jsonb, '{"en":"Odisha e-Admission and e-Scholarship services."}'::jsonb, 'https://www.samsodisha.gov.in', 100),
  ('certificates', '{"en":"Odisha e-District"}'::jsonb, '{"en":"Caste, income, residence and other state certificates."}'::jsonb, 'https://edistrict.odisha.gov.in', 110),
  ('food', '{"en":"Food Odisha"}'::jsonb, '{"en":"Ration card related services."}'::jsonb, 'https://www.foododisha.in/', 120)
) as seed(category_key, name_i18n, description_i18n, official_url, sort_order)
where bu.code = 'digital-service'
  and not exists (
    select 1 from public.government_services gs
    where gs.business_id = bu.id and gs.official_url = seed.official_url
  );

-- Seed the existing public rate card. Non-numeric display text is stored in
-- description_i18n.price_display; base_price remains numeric for accounting.
insert into public.service_catalog
  (business_id, service_code, name_i18n, description_i18n, unit_label_i18n,
   base_price, is_active, is_public, sort_order)
select bu.id, seed.service_code, seed.name_i18n, seed.description_i18n,
       seed.unit_label_i18n, seed.base_price, true, true, seed.sort_order
from public.business_units bu
cross join (values
  ('passport_photo_8', '{"en":"Passport size photo (8 copies)"}'::jsonb, '{"en":{"detail":"Ready in 10 minutes","price_display":"₹ 50"}}'::jsonb, '{"en":"Ready in 10 minutes"}'::jsonb, 50::numeric, 10),
  ('bw_print_a4', '{"en":"B/W printing"}'::jsonb, '{"en":{"detail":"Per A4 page","price_display":"₹ 5"}}'::jsonb, '{"en":"Per A4 page"}'::jsonb, 5::numeric, 20),
  ('colour_print_a4', '{"en":"Colour printing"}'::jsonb, '{"en":{"detail":"Per A4 page","price_display":"₹ 10"}}'::jsonb, '{"en":"Per A4 page"}'::jsonb, 10::numeric, 30),
  ('photocopy_a4', '{"en":"Photocopy"}'::jsonb, '{"en":{"detail":"Per A4 page","price_display":"₹ 2"}}'::jsonb, '{"en":"Per A4 page"}'::jsonb, 2::numeric, 40),
  ('lamination_id', '{"en":"Lamination"}'::jsonb, '{"en":{"detail":"ID card size","price_display":"₹ 20"}}'::jsonb, '{"en":"ID card size"}'::jsonb, 20::numeric, 50),
  ('govt_form_assisted', '{"en":"Govt. form filling (assisted)"}'::jsonb, '{"en":{"detail":"Aadhaar, PAN, exam and other forms","price_display":"₹ 100 +"}}'::jsonb, '{"en":"Aadhaar, PAN, exam and other forms"}'::jsonb, 100::numeric, 60),
  ('photo_frames', '{"en":"Photo Frames"}'::jsonb, '{"en":{"detail":"By size","price_display":"As per size: 4x6 / 8x12 / 12x18"}}'::jsonb, '{"en":"By size"}'::jsonb, 0::numeric, 70),
  ('photo_video', '{"en":"Photography, Videography"}'::jsonb, '{"en":{"detail":"Days / Location","price_display":"On request"}}'::jsonb, '{"en":"Days / Location"}'::jsonb, 0::numeric, 80)
) as seed(service_code, name_i18n, description_i18n, unit_label_i18n, base_price, sort_order)
where bu.code = 'digital-service'
on conflict (business_id, service_code) do nothing;

-- Seed current public contact details without overwriting future changes.
insert into public.site_settings (business_id, setting_key, setting_value, is_public)
select bu.id, 'contact_details', jsonb_build_object(
  'address', 'Near Bank of Baroda, Junagarh, Kalahandi, Pin-766014',
  'phone', '+91 7978484716',
  'email', 'bharateegraphics@gmail.com',
  'hours_weekdays', 'Monday – Saturday: 9:00 AM – 9:00 PM',
  'hours_sunday', 'Sunday: 10:00 AM – 6:00 PM',
  'studio_hours', 'Studio bookings: By appointment'
), true
from public.business_units bu
where bu.code = 'digital-service'
on conflict (business_id, setting_key) do nothing;

commit;

-- Verification queries (run separately):
-- select page_key, section_key, locale, is_published from public.site_content
--  where page_key='home' order by section_key, locale;
-- select count(*) from public.government_services where is_active and is_published;
-- select count(*) from public.service_catalog where is_active and is_public;
-- select setting_key, is_public from public.site_settings where setting_key='contact_details';
