drop index if exists public.reports_active_time_idx;
create index reports_active_time_idx
  on public.reports (operational_status, starts_at desc)
  where operational_status in ('active', 'monitoring', 'resolving');

create or replace function public.can_update_report(p_report_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.reports r
    where r.id = p_report_id
      and r.operational_status not in ('expired', 'rejected')
      and (r.created_by = auth.uid() or public.is_moderator())
  );
$$;

create or replace function public.get_report_timeline(p_report_id uuid)
returns table (
  id uuid,
  report_id uuid,
  kind public.report_update_kind,
  body text,
  operational_status public.operational_status,
  official boolean,
  source_label text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.id,
    t.report_id,
    t.kind,
    t.body,
    t.operational_status,
    t.official,
    t.source_label,
    t.created_at
  from public.public_report_timeline t
  where t.report_id = p_report_id
  order by t.created_at desc
  limit 100;
$$;

create or replace function public.add_report_update(
  p_report_id uuid,
  p_kind public.report_update_kind,
  p_body text,
  p_operational_status public.operational_status,
  p_idempotency_key uuid
)
returns table (
  id uuid,
  report_id uuid,
  kind public.report_update_kind,
  body text,
  operational_status public.operational_status,
  official boolean,
  source_label text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_current_status public.operational_status;
  v_update_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  select r.operational_status
  into v_current_status
  from public.reports r
  where r.id = p_report_id
    and (r.created_by = v_user_id or public.is_moderator());

  if v_current_status is null then
    raise exception 'report_update_forbidden';
  end if;
  if v_current_status in ('expired', 'rejected') then
    raise exception 'report_not_updateable';
  end if;

  select u.id
  into v_update_id
  from public.report_updates u
  where u.report_id = p_report_id
    and u.idempotency_key = p_idempotency_key;

  if v_update_id is not null then
    return query
    select
      t.id,
      t.report_id,
      t.kind,
      t.body,
      t.operational_status,
      t.official,
      t.source_label,
      t.created_at
    from public.public_report_timeline t
    where t.id = v_update_id;
    return;
  end if;

  if p_kind not in ('note', 'status_change') then
    raise exception 'invalid_update_kind';
  end if;
  if p_kind = 'note' and nullif(trim(p_body), '') is null then
    raise exception 'update_body_required';
  end if;
  if p_kind = 'status_change' and p_operational_status is null then
    raise exception 'operational_status_required';
  end if;
  if p_kind = 'status_change' and p_operational_status not in ('active', 'resolving', 'resolved') then
    raise exception 'operational_status_forbidden';
  end if;
  if p_kind = 'status_change' and p_operational_status = v_current_status then
    raise exception 'status_unchanged';
  end if;
  if p_kind = 'status_change' and not (
    (v_current_status = 'active' and p_operational_status in ('resolving', 'resolved'))
    or (v_current_status = 'monitoring' and p_operational_status in ('active', 'resolving', 'resolved'))
    or (v_current_status = 'resolving' and p_operational_status in ('active', 'resolved'))
    or (v_current_status = 'resolved' and p_operational_status = 'active')
  ) then
    raise exception 'invalid_status_transition';
  end if;

  insert into public.report_updates (
    report_id,
    kind,
    body,
    operational_status,
    created_by,
    idempotency_key,
    published_at
  ) values (
    p_report_id,
    p_kind,
    nullif(trim(p_body), ''),
    case when p_kind = 'status_change' then p_operational_status else null end,
    v_user_id,
    p_idempotency_key,
    now()
  )
  returning public.report_updates.id into v_update_id;

  if p_kind = 'status_change' then
    update public.reports
    set operational_status = p_operational_status, updated_at = now()
    where public.reports.id = p_report_id;
  else
    update public.reports
    set updated_at = now()
    where public.reports.id = p_report_id;
  end if;

  insert into public.notification_outbox (
    event_type,
    aggregate_type,
    aggregate_id,
    payload,
    dedupe_key
  ) values (
    case
      when p_kind = 'status_change' then 'report_status_changed'::public.notification_event_type
      else 'report_updated'::public.notification_event_type
    end,
    'report',
    p_report_id,
    jsonb_build_object(
      'reportId', p_report_id,
      'updateId', v_update_id,
      'kind', p_kind,
      'operationalStatus', p_operational_status
    ),
    'report-update:' || v_update_id::text
  )
  on conflict (dedupe_key) do nothing;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id)
  values (v_user_id, 'report.update_published', 'report_update', v_update_id);

  return query
  select
    t.id,
    t.report_id,
    t.kind,
    t.body,
    t.operational_status,
    t.official,
    t.source_label,
    t.created_at
  from public.public_report_timeline t
  where t.id = v_update_id;
end;
$$;

create or replace function public.confirm_report(
  p_report_id uuid,
  p_kind public.confirmation_kind,
  p_longitude double precision,
  p_latitude double precision,
  p_idempotency_key uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;
  if (p_longitude is null) <> (p_latitude is null) then
    raise exception 'incomplete_coordinate';
  end if;
  if p_longitude is not null and (
    p_longitude not between -180 and 180 or p_latitude not between -90 and 90
  ) then
    raise exception 'invalid_coordinate';
  end if;
  if not exists (
    select 1 from public.reports
    where id = p_report_id and operational_status in ('active', 'monitoring', 'resolving')
  ) then
    raise exception 'report_not_active';
  end if;

  insert into public.report_confirmations (
    report_id, user_id, kind, observed_geometry, idempotency_key
  ) values (
    p_report_id,
    v_user_id,
    p_kind,
    case
      when p_longitude is null or p_latitude is null then null
      else st_setsrid(st_makepoint(p_longitude, p_latitude), 4326)
    end,
    p_idempotency_key
  )
  on conflict (report_id, user_id)
  do update set kind = excluded.kind, observed_geometry = excluded.observed_geometry, updated_at = now();

  perform public.recalculate_report_counts(p_report_id);
  return true;
end;
$$;

create or replace function public.get_map_items(
  p_west double precision,
  p_south double precision,
  p_east double precision,
  p_north double precision,
  p_category_slugs text[] default '{}',
  p_center_longitude double precision default null,
  p_center_latitude double precision default null,
  p_radius_meters double precision default null
)
returns table (
  id uuid,
  type public.report_type,
  category_slug text,
  category_name text,
  title text,
  longitude double precision,
  latitude double precision,
  severity public.severity,
  verification_status public.verification_status,
  operational_status public.operational_status,
  starts_at timestamptz,
  expires_at timestamptz,
  confirmation_count integer,
  distance_meters double precision
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    r.id,
    r.type,
    c.slug,
    c.name,
    r.title,
    st_x(st_centroid(r.geometry)),
    st_y(st_centroid(r.geometry)),
    r.severity,
    r.verification_status,
    r.operational_status,
    r.starts_at,
    r.expires_at,
    r.confirmation_count,
    case
      when p_center_longitude is not null and p_center_latitude is not null then
        st_distance(
          st_centroid(r.geometry)::geography,
          st_setsrid(st_makepoint(p_center_longitude, p_center_latitude), 4326)::geography
        )
      else null
    end as distance_meters
  from public.reports r
  join public.categories c on c.id = r.category_id
  where r.operational_status in ('active', 'monitoring', 'resolving')
    and (r.expires_at is null or r.expires_at > now())
    and r.geometry && st_makeenvelope(p_west, p_south, p_east, p_north, 4326)
    and (cardinality(p_category_slugs) = 0 or c.slug = any(p_category_slugs))
    and (
      p_radius_meters is null
      or p_center_longitude is null
      or p_center_latitude is null
      or st_dwithin(
        st_centroid(r.geometry)::geography,
        st_setsrid(st_makepoint(p_center_longitude, p_center_latitude), 4326)::geography,
        p_radius_meters
      )
    )
  order by
    case r.severity
      when 'critical' then 5
      when 'high' then 4
      when 'medium' then 3
      when 'low' then 2
      else 1
    end desc,
    distance_meters asc nulls last,
    r.starts_at desc,
    case r.verification_status
      when 'official_verified' then 4
      when 'community_verified' then 3
      when 'unverified' then 2
      else 1
    end desc
  limit 1000;
$$;

create or replace function public.expire_stale_reports()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.reports
  set operational_status = 'expired', updated_at = now()
  where operational_status in ('active', 'monitoring', 'resolving')
    and expires_at is not null
    and expires_at <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.can_update_report from public;
revoke all on function public.get_report_timeline from public;
revoke all on function public.add_report_update from public;
grant execute on function public.can_update_report to authenticated;
grant execute on function public.get_report_timeline to anon, authenticated;
grant execute on function public.add_report_update to authenticated;

comment on function public.can_update_report is
  'Returns update capability without exposing report ownership.';
comment on function public.get_report_timeline is
  'Public timeline boundary capped at 100 published identity-safe items.';
comment on function public.add_report_update is
  'Authenticated idempotent owner/moderator command with explicit lifecycle transitions.';
