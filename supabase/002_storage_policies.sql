-- BHARATEE DIGITAL SERVICE + BHARATEE GRAPHIX
-- Storage RLS policies for the two buckets created in Supabase.
-- Run this in Supabase SQL Editor after 001_initial_schema.sql and after
-- confirming that the owner has active business_members rows for BOTH units.
--
-- Object path convention (required):
--   public-site-media/digital-service/website/<filename>
--   public-site-media/digital-service/gallery/<filename>
--   public-site-media/graphix/logo/<filename>
--   public-site-media/graphix/gallery/<filename>
--   private-business-files/digital-service/<category>/<filename>
--   private-business-files/graphix/<category>/<filename>
--
-- Do not put files at the bucket root. The first folder must be exactly
-- 'digital-service' or 'graphix'.
--
-- Public bucket objects are publicly retrievable by URL. These policies only
-- control authenticated listing/upload/update/delete operations. Never put
-- customer identity documents, financial receipts, or private records in the
-- public bucket.

begin;

-- Remove only this migration's policy names so this file can be safely rerun.
drop policy if exists bharatee_public_media_select on storage.objects;
drop policy if exists bharatee_public_media_insert on storage.objects;
drop policy if exists bharatee_public_media_update on storage.objects;
drop policy if exists bharatee_public_media_delete on storage.objects;

drop policy if exists bharatee_private_files_select on storage.objects;
drop policy if exists bharatee_private_files_insert on storage.objects;
drop policy if exists bharatee_private_files_update on storage.objects;
drop policy if exists bharatee_private_files_delete on storage.objects;

-- PUBLIC MEDIA: authenticated team members may list metadata for their own
-- business folder. Anyone can retrieve a known public object URL because the
-- bucket itself is public.
create policy bharatee_public_media_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'public-site-media'
  and (storage.foldername(name))[1] in ('digital-service', 'graphix')
  and exists (
    select 1
    from public.business_units bu
    where bu.code = (storage.foldername(name))[1]
      and public.has_business_role(
        bu.id,
        array['owner','admin','manager','cyber_staff','studio_staff']::text[]
      )
  )
);

-- Uploaders: owner/admin/manager, plus the staff role for that business.
create policy bharatee_public_media_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'public-site-media'
  and (storage.foldername(name))[1] in ('digital-service', 'graphix')
  and exists (
    select 1
    from public.business_units bu
    where bu.code = (storage.foldername(name))[1]
      and public.has_business_role(
        bu.id,
        case bu.code
          when 'digital-service' then array['owner','admin','manager','cyber_staff']::text[]
          when 'graphix' then array['owner','admin','manager','studio_staff']::text[]
          else array[]::text[]
        end
      )
  )
);

-- Only owner/admin/manager can replace public media.
create policy bharatee_public_media_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'public-site-media'
  and (storage.foldername(name))[1] in ('digital-service', 'graphix')
  and exists (
    select 1
    from public.business_units bu
    where bu.code = (storage.foldername(name))[1]
      and public.has_business_role(bu.id, array['owner','admin','manager']::text[])
  )
)
with check (
  bucket_id = 'public-site-media'
  and (storage.foldername(name))[1] in ('digital-service', 'graphix')
  and exists (
    select 1
    from public.business_units bu
    where bu.code = (storage.foldername(name))[1]
      and public.has_business_role(bu.id, array['owner','admin','manager']::text[])
  )
);

create policy bharatee_public_media_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'public-site-media'
  and (storage.foldername(name))[1] in ('digital-service', 'graphix')
  and exists (
    select 1
    from public.business_units bu
    where bu.code = (storage.foldername(name))[1]
      and public.has_business_role(bu.id, array['owner','admin','manager']::text[])
  )
);

-- PRIVATE BUSINESS FILES: only owner/admin/manager/accountant can list,
-- upload, or replace private finance/business documents. The policy is scoped
-- to the business folder at the start of the object path.
create policy bharatee_private_files_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'private-business-files'
  and (storage.foldername(name))[1] in ('digital-service', 'graphix')
  and exists (
    select 1
    from public.business_units bu
    where bu.code = (storage.foldername(name))[1]
      and public.has_business_role(
        bu.id,
        array['owner','admin','manager','accountant']::text[]
      )
  )
);

create policy bharatee_private_files_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'private-business-files'
  and (storage.foldername(name))[1] in ('digital-service', 'graphix')
  and exists (
    select 1
    from public.business_units bu
    where bu.code = (storage.foldername(name))[1]
      and public.has_business_role(
        bu.id,
        array['owner','admin','manager','accountant']::text[]
      )
  )
);

create policy bharatee_private_files_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'private-business-files'
  and (storage.foldername(name))[1] in ('digital-service', 'graphix')
  and exists (
    select 1
    from public.business_units bu
    where bu.code = (storage.foldername(name))[1]
      and public.has_business_role(
        bu.id,
        array['owner','admin','manager','accountant']::text[]
      )
  )
)
with check (
  bucket_id = 'private-business-files'
  and (storage.foldername(name))[1] in ('digital-service', 'graphix')
  and exists (
    select 1
    from public.business_units bu
    where bu.code = (storage.foldername(name))[1]
      and public.has_business_role(
        bu.id,
        array['owner','admin','manager','accountant']::text[]
      )
  )
);

-- Only owner/admin/manager can permanently delete private files.
create policy bharatee_private_files_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'private-business-files'
  and (storage.foldername(name))[1] in ('digital-service', 'graphix')
  and exists (
    select 1
    from public.business_units bu
    where bu.code = (storage.foldername(name))[1]
      and public.has_business_role(bu.id, array['owner','admin','manager']::text[])
  )
);

commit;

-- Verification query (run separately after this migration):
-- select policyname, cmd, roles
-- from pg_policies
-- where schemaname = 'storage'
--   and tablename = 'objects'
--   and policyname like 'bharatee_%'
-- order by policyname;
