alter table public.report_media
  add column created_by uuid references auth.users(id) on delete set null,
  add column upload_status text not null default 'pending',
  add column file_size_bytes integer,
  add column idempotency_key uuid,
  add column uploaded_at timestamptz,
  add column approved_at timestamptz,
  add column rejection_reason text,
  add constraint report_media_upload_status_check
    check (upload_status in ('pending', 'uploaded', 'processing', 'approved', 'rejected', 'failed')),
  add constraint report_media_mime_type_check
    check (idempotency_key is null or mime_type = 'image/jpeg'),
  add constraint report_media_dimensions_check
    check (idempotency_key is null or (width between 1 and 1600 and height between 1 and 1600)),
  add constraint report_media_file_size_check
    check (idempotency_key is null or file_size_bytes between 1 and 5000000),
  add constraint report_media_creator_idempotency_unique unique (created_by, idempotency_key);

update public.report_media
set upload_status = case moderation_status
  when 'approved' then 'approved'
  when 'rejected' then 'rejected'
  else upload_status
end;

create index report_media_owner_status_idx
  on public.report_media (created_by, report_id, upload_status, created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'report-evidence-private',
  'report-evidence-private',
  false,
  5000000,
  array['image/jpeg']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'report-evidence-public',
  'report-evidence-public',
  true,
  5000000,
  array['image/jpeg']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.prepare_report_media_upload(
  p_report_id uuid,
  p_mime_type text,
  p_width integer,
  p_height integer,
  p_file_size_bytes integer,
  p_idempotency_key uuid
)
returns table (media_id uuid, storage_path text, upload_required boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_media_id uuid;
  v_storage_path text;
  v_upload_status text;
  v_suspended_until timestamptz;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;
  if p_mime_type <> 'image/jpeg' then
    raise exception 'unsupported_media_type';
  end if;
  if p_width not between 1 and 1600 or p_height not between 1 and 1600 then
    raise exception 'invalid_media_dimensions';
  end if;
  if p_file_size_bytes not between 1 and 5000000 then
    raise exception 'media_too_large';
  end if;

  select contribution_suspended_until into v_suspended_until
  from public.profiles where id = v_user_id;
  if v_suspended_until is not null and v_suspended_until > now() then
    raise exception 'contribution_suspended';
  end if;
  if not exists (
    select 1 from public.reports
    where id = p_report_id
      and operational_status in ('active', 'monitoring', 'resolving')
      and (created_by = v_user_id or public.is_moderator())
  ) then
    raise exception 'report_not_uploadable';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_report_id::text, 0));

  select m.id, m.storage_path, m.upload_status
  into v_media_id, v_storage_path, v_upload_status
  from public.report_media m
  where m.created_by = v_user_id and m.idempotency_key = p_idempotency_key;
  if v_media_id is not null then
    if v_upload_status = 'rejected' then
      raise exception 'media_rejected';
    end if;
    if v_upload_status = 'failed' then
      update public.report_media
      set upload_status = 'pending'
      where id = v_media_id;
      v_upload_status := 'pending';
    end if;
    return query select v_media_id, v_storage_path, v_upload_status = 'pending';
    return;
  end if;

  if (
    select count(*)
    from public.report_media m
    where m.report_id = p_report_id
      and m.upload_status not in ('failed', 'rejected')
  ) >= 3 then
    raise exception 'media_limit_reached';
  end if;

  v_media_id := gen_random_uuid();
  v_storage_path := v_user_id::text || '/' || p_report_id::text || '/' || v_media_id::text || '.jpg';

  insert into public.report_media (
    id,
    report_id,
    storage_path,
    mime_type,
    width,
    height,
    created_by,
    upload_status,
    file_size_bytes,
    idempotency_key
  ) values (
    v_media_id,
    p_report_id,
    v_storage_path,
    p_mime_type,
    p_width,
    p_height,
    v_user_id,
    'pending',
    p_file_size_bytes,
    p_idempotency_key
  );

  return query select v_media_id, v_storage_path, true;
end;
$$;

create or replace function public.complete_report_media_upload(
  p_media_id uuid,
  p_idempotency_key uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_report_id uuid;
  v_status text;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;
  if p_idempotency_key is null then
    raise exception 'idempotency_key_required';
  end if;

  select report_id, upload_status into v_report_id, v_status
  from public.report_media
  where id = p_media_id and created_by = v_user_id
  for update;

  if v_report_id is null then
    raise exception 'media_not_found';
  end if;
  if v_status in ('uploaded', 'processing', 'approved') then
    return true;
  end if;
  if v_status <> 'pending' then
    raise exception 'media_not_completable';
  end if;

  update public.report_media
  set upload_status = 'uploaded', uploaded_at = now()
  where id = p_media_id;

  insert into public.notification_outbox (
    event_type,
    aggregate_type,
    aggregate_id,
    payload,
    dedupe_key
  ) values (
    'report_updated',
    'report',
    v_report_id,
    jsonb_build_object('reportId', v_report_id, 'mediaId', p_media_id, 'kind', 'evidence_added'),
    'media-uploaded:' || p_media_id::text
  )
  on conflict (dedupe_key) do nothing;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    v_user_id,
    'report_media.uploaded',
    'report_media',
    p_media_id,
    jsonb_build_object('idempotencyKey', p_idempotency_key)
  );

  return true;
end;
$$;

create policy "users read own report media"
  on public.report_media
  for select to authenticated
  using (created_by = auth.uid() or public.is_moderator());

grant select on public.report_media to authenticated;
revoke all on function public.prepare_report_media_upload from public;
revoke all on function public.complete_report_media_upload from public;
grant execute on function public.prepare_report_media_upload to authenticated;
grant execute on function public.complete_report_media_upload to authenticated;

comment on function public.prepare_report_media_upload is
  'Creates an idempotent private JPEG upload reservation for the report owner; maximum three active uploads per report.';
comment on function public.complete_report_media_upload is
  'Marks a caller-owned upload complete and queues moderation processing; it does not publish media.';
