alter table public.report_media
  add column public_storage_path text,
  add column moderated_by uuid references auth.users(id) on delete set null,
  add column moderated_at timestamptz,
  add column moderation_idempotency_key uuid;

create unique index report_media_moderator_idempotency_unique
  on public.report_media (moderated_by, moderation_idempotency_key)
  where moderation_idempotency_key is not null;

create index report_media_moderation_queue_idx
  on public.report_media (upload_status, uploaded_at, created_at)
  where upload_status in ('uploaded', 'processing');

create or replace function public.get_report_media_moderation_queue()
returns table (
  media_id uuid,
  report_id uuid,
  report_title text,
  category_name text,
  address_label text,
  severity public.severity,
  mime_type text,
  width integer,
  height integer,
  file_size_bytes integer,
  uploaded_at timestamptz,
  upload_status text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;
  if not public.is_moderator() then
    raise exception 'moderator_required';
  end if;

  return query
  select
    m.id,
    m.report_id,
    r.title,
    c.name,
    r.address_label,
    r.severity,
    m.mime_type,
    m.width,
    m.height,
    m.file_size_bytes,
    m.uploaded_at,
    m.upload_status
  from public.report_media m
  join public.reports r on r.id = m.report_id
  join public.categories c on c.id = r.category_id
  where m.idempotency_key is not null
    and (
      m.upload_status = 'uploaded'
      or (m.upload_status = 'processing' and m.moderated_at < now() - interval '15 minutes')
    )
    and m.mime_type = 'image/jpeg'
    and m.width is not null
    and m.height is not null
    and m.file_size_bytes is not null
    and m.uploaded_at is not null
  order by
    case r.severity
      when 'critical' then 0
      when 'high' then 1
      when 'medium' then 2
      when 'low' then 3
      else 4
    end,
    m.uploaded_at asc
  limit 100;
end;
$$;

create or replace function public.prepare_report_media_moderation(
  p_media_id uuid,
  p_decision text,
  p_reason text,
  p_idempotency_key uuid
)
returns table (
  media_id uuid,
  report_id uuid,
  moderation_status text,
  public_url text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_media public.report_media%rowtype;
  v_public_path text;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;
  if not public.is_moderator() then
    raise exception 'moderator_required';
  end if;
  if p_idempotency_key is null then
    raise exception 'idempotency_key_required';
  end if;
  if p_decision not in ('approve', 'reject') then
    raise exception 'invalid_moderation_decision';
  end if;
  if p_decision = 'reject' and nullif(trim(p_reason), '') is null then
    raise exception 'rejection_reason_required';
  end if;
  if p_reason is not null and char_length(trim(p_reason)) > 500 then
    raise exception 'rejection_reason_too_long';
  end if;

  if exists (
    select 1
    from public.report_media m
    where m.moderated_by = v_user_id
      and m.moderation_idempotency_key = p_idempotency_key
      and m.id <> p_media_id
  ) then
    raise exception 'idempotency_key_conflict';
  end if;

  select * into v_media
  from public.report_media
  where id = p_media_id
  for update;

  if v_media.id is null then
    raise exception 'media_not_found';
  end if;

  if v_media.moderated_by = v_user_id
    and v_media.moderation_idempotency_key = p_idempotency_key
    and v_media.upload_status in ('processing', 'approved', 'rejected') then
    if (v_media.upload_status in ('processing', 'approved') and p_decision <> 'approve')
      or (v_media.upload_status = 'rejected' and p_decision <> 'reject') then
      raise exception 'idempotency_key_conflict';
    end if;
    return query select
      v_media.id,
      v_media.report_id,
      v_media.upload_status,
      v_media.thumbnail_path;
    return;
  end if;

  if v_media.upload_status = 'processing'
    and v_media.moderated_at >= now() - interval '15 minutes' then
    raise exception 'media_already_claimed';
  end if;
  if v_media.upload_status not in ('uploaded', 'processing') then
    raise exception 'media_not_moderatable';
  end if;

  v_public_path := v_media.report_id::text || '/' || v_media.id::text || '.jpg';

  if p_decision = 'reject' then
    update public.report_media
    set upload_status = 'rejected',
        moderation_status = 'rejected',
        rejection_reason = trim(p_reason),
        public_storage_path = null,
        thumbnail_path = null,
        approved_at = null,
        moderated_by = v_user_id,
        moderated_at = now(),
        moderation_idempotency_key = p_idempotency_key
    where id = p_media_id;

    insert into public.notification_outbox (
      event_type,
      aggregate_type,
      aggregate_id,
      recipient_user_id,
      payload,
      dedupe_key
    ) values (
      'report_updated',
      'report',
      v_media.report_id,
      v_media.created_by,
      jsonb_build_object('reportId', v_media.report_id, 'mediaId', v_media.id, 'kind', 'media_rejected'),
      'media-rejected:' || v_media.id::text
    )
    on conflict (dedupe_key) do nothing;

    insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    values (
      v_user_id,
      'report_media.rejected',
      'report_media',
      v_media.id,
      jsonb_build_object('reason', trim(p_reason), 'idempotencyKey', p_idempotency_key)
    );

    return query select
      v_media.id,
      v_media.report_id,
      'rejected'::text,
      null::text;
    return;
  end if;

  update public.report_media
  set upload_status = 'processing',
      moderation_status = 'pending',
      rejection_reason = null,
      public_storage_path = v_public_path,
      moderated_by = v_user_id,
      moderated_at = now(),
      moderation_idempotency_key = p_idempotency_key
  where id = p_media_id;

  return query select
    v_media.id,
    v_media.report_id,
    'processing'::text,
    null::text;
end;
$$;

create or replace function public.complete_report_media_moderation(
  p_media_id uuid,
  p_idempotency_key uuid,
  p_public_url text
)
returns table (media_id uuid, moderation_status text, public_url text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_media public.report_media%rowtype;
begin
  select * into v_media
  from public.report_media
  where id = p_media_id
  for update;

  if v_media.id is null then
    raise exception 'media_not_found';
  end if;
  if v_media.upload_status = 'approved'
    and v_media.moderation_idempotency_key = p_idempotency_key then
    return query select v_media.id, 'approved'::text, v_media.thumbnail_path;
    return;
  end if;
  if v_media.upload_status <> 'processing'
    or v_media.moderation_idempotency_key <> p_idempotency_key then
    raise exception 'media_claim_mismatch';
  end if;
  if v_media.public_storage_path <> (v_media.report_id::text || '/' || v_media.id::text || '.jpg') then
    raise exception 'invalid_public_storage_path';
  end if;
  if p_public_url is null or p_public_url !~ '^https://[^[:space:]]+$' then
    raise exception 'invalid_public_url';
  end if;

  update public.report_media
  set upload_status = 'approved',
      moderation_status = 'approved',
      thumbnail_path = p_public_url,
      approved_at = now(),
      moderated_at = now()
  where id = p_media_id;

  insert into public.report_updates (
    report_id,
    kind,
    body,
    created_by,
    idempotency_key,
    published_at
  ) values (
    v_media.report_id,
    'evidence_added',
    'Ảnh hiện trường đã được kiểm duyệt.',
    v_media.moderated_by,
    p_idempotency_key,
    now()
  )
  on conflict (report_id, idempotency_key) do nothing;

  insert into public.notification_outbox (
    event_type,
    aggregate_type,
    aggregate_id,
    payload,
    dedupe_key
  ) values (
    'report_updated',
    'report',
    v_media.report_id,
    jsonb_build_object('reportId', v_media.report_id, 'mediaId', v_media.id, 'kind', 'evidence_added'),
    'media-approved:' || v_media.id::text
  )
  on conflict (dedupe_key) do nothing;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    v_media.moderated_by,
    'report_media.approved',
    'report_media',
    v_media.id,
    jsonb_build_object('publicStoragePath', v_media.public_storage_path, 'idempotencyKey', p_idempotency_key)
  );

  return query select v_media.id, 'approved'::text, p_public_url;
end;
$$;

create or replace function public.release_report_media_moderation_claim(
  p_media_id uuid,
  p_idempotency_key uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.report_media
  set upload_status = 'uploaded',
      public_storage_path = null,
      moderated_by = null,
      moderated_at = null,
      moderation_idempotency_key = null
  where id = p_media_id
    and upload_status = 'processing'
    and moderation_idempotency_key = p_idempotency_key;

  return found;
end;
$$;

revoke all on function public.get_report_media_moderation_queue from public;
revoke all on function public.prepare_report_media_moderation from public;
revoke all on function public.complete_report_media_moderation from public;
revoke all on function public.release_report_media_moderation_claim from public;
grant execute on function public.get_report_media_moderation_queue to authenticated;
grant execute on function public.prepare_report_media_moderation to authenticated;
grant execute on function public.complete_report_media_moderation to service_role;
grant execute on function public.release_report_media_moderation_claim to service_role;

comment on function public.get_report_media_moderation_queue is
  'Returns client-safe private media metadata to authenticated moderators; storage paths stay server-only.';
comment on function public.prepare_report_media_moderation is
  'Idempotently rejects media or claims it for publication; moderator authorization is enforced in the database.';
comment on function public.complete_report_media_moderation is
  'Service-role-only publication finalizer called after the approved object exists in the public bucket.';
comment on function public.release_report_media_moderation_claim is
  'Service-role-only compensation command used when public object publication fails.';
