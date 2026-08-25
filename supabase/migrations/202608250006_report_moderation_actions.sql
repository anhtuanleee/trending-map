alter table public.moderation_cases
  add column resolution text,
  add column resolution_reason text,
  add column resolved_by uuid references auth.users(id) on delete set null,
  add column updated_at timestamptz not null default now(),
  add constraint moderation_cases_resolution_check
    check (resolution is null or resolution in ('approve', 'resolve', 'reject')),
  add constraint moderation_cases_resolution_reason_check
    check (resolution_reason is null or char_length(resolution_reason) between 1 and 500);

update public.moderation_cases set priority = least(5, greatest(0, priority));
alter table public.moderation_cases
  add constraint moderation_cases_priority_range check (priority between 0 and 5);

with ranked_active_cases as (
  select
    id,
    row_number() over (partition by report_id order by priority desc, created_at asc, id) as position
  from public.moderation_cases
  where status in ('open', 'in_review')
)
update public.moderation_cases c
set status = 'dismissed',
    resolution = null,
    resolution_reason = null,
    resolved_at = now(),
    updated_at = now()
from ranked_active_cases ranked
where c.id = ranked.id and ranked.position > 1;

create unique index moderation_cases_active_report_unique
  on public.moderation_cases (report_id)
  where status in ('open', 'in_review');

create index moderation_cases_queue_idx
  on public.moderation_cases (priority desc, created_at asc)
  where status in ('open', 'in_review');

create table public.report_moderation_actions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.moderation_cases(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('approve', 'resolve', 'reject')),
  reason text check (reason is null or char_length(reason) between 1 and 500),
  idempotency_key uuid not null,
  result_verification_status public.verification_status not null,
  result_operational_status public.operational_status not null,
  created_at timestamptz not null default now(),
  unique (actor_id, idempotency_key)
);

create trigger moderation_cases_set_updated_at
before update on public.moderation_cases
for each row execute function public.set_updated_at();

create or replace function public.ensure_report_moderation_case()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.operational_status in ('active', 'monitoring', 'resolving')
    and new.verification_status in ('unverified', 'disputed')
    and not exists (
      select 1
      from public.moderation_cases c
      where c.report_id = new.id and c.status in ('open', 'in_review')
    ) then
    insert into public.moderation_cases (report_id, priority, reason)
    values (
      new.id,
      case new.severity
        when 'critical' then 5
        when 'high' then 4
        when 'medium' then 2
        when 'low' then 1
        else 0
      end,
      case when new.verification_status = 'disputed' then 'community_disputed' else 'new_report' end
    );
  end if;
  return new;
end;
$$;

create trigger reports_ensure_moderation_case
after insert or update of verification_status on public.reports
for each row execute function public.ensure_report_moderation_case();

insert into public.moderation_cases (report_id, priority, reason)
select
  r.id,
  case r.severity
    when 'critical' then 5
    when 'high' then 4
    when 'medium' then 2
    when 'low' then 1
    else 0
  end,
  case when r.verification_status = 'disputed' then 'community_disputed' else 'new_report' end
from public.reports r
where r.operational_status in ('active', 'monitoring', 'resolving')
  and r.verification_status in ('unverified', 'disputed')
  and not exists (
    select 1 from public.moderation_cases c
    where c.report_id = r.id and c.status in ('open', 'in_review')
  );

create or replace function public.capture_report_status_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.report_status_history (
    report_id,
    previous_verification_status,
    next_verification_status,
    previous_operational_status,
    next_operational_status,
    reason,
    actor_id
  ) values (
    new.id,
    old.verification_status,
    new.verification_status,
    old.operational_status,
    new.operational_status,
    nullif(current_setting('app.moderation_reason', true), ''),
    auth.uid()
  );
  return new;
end;
$$;

create or replace function public.recalculate_report_counts(p_report_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seen integer;
  v_not_there integer;
begin
  select
    count(*) filter (where kind = 'seen'),
    count(*) filter (where kind = 'not_there')
  into v_seen, v_not_there
  from public.report_confirmations
  where report_id = p_report_id;

  update public.reports
  set
    confirmation_count = v_seen,
    not_there_count = v_not_there,
    verification_status = case
      when verification_status in ('moderator_verified', 'official_verified') then verification_status
      when v_not_there >= greatest(3, v_seen) then 'disputed'
      when v_seen >= 3 then 'community_verified'
      else 'unverified'
    end,
    updated_at = now()
  where id = p_report_id;
end;
$$;

create or replace function public.get_report_moderation_queue()
returns table (
  case_id uuid,
  report_id uuid,
  report_type public.report_type,
  category_name text,
  title text,
  description text,
  address_label text,
  severity public.severity,
  verification_status public.verification_status,
  operational_status public.operational_status,
  confirmation_count integer,
  not_there_count integer,
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz,
  priority smallint,
  case_status text,
  queue_reason text
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
    c.id,
    r.id,
    r.type,
    category.name,
    r.title,
    r.description,
    r.address_label,
    r.severity,
    r.verification_status,
    r.operational_status,
    r.confirmation_count,
    r.not_there_count,
    r.starts_at,
    r.expires_at,
    r.created_at,
    c.priority,
    c.status,
    c.reason
  from public.moderation_cases c
  join public.reports r on r.id = c.report_id
  join public.categories category on category.id = r.category_id
  where c.status in ('open', 'in_review')
    and r.operational_status in ('active', 'monitoring', 'resolving')
    and r.verification_status not in ('moderator_verified', 'official_verified')
  order by
    c.priority desc,
    case r.severity
      when 'critical' then 0
      when 'high' then 1
      when 'medium' then 2
      when 'low' then 3
      else 4
    end,
    case r.verification_status when 'disputed' then 0 else 1 end,
    c.created_at asc
  limit 100;
end;
$$;

create or replace function public.moderate_report_case(
  p_case_id uuid,
  p_action text,
  p_reason text,
  p_idempotency_key uuid
)
returns table (
  case_id uuid,
  report_id uuid,
  moderation_action text,
  case_status text,
  verification_status public.verification_status,
  operational_status public.operational_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_case public.moderation_cases%rowtype;
  v_report public.reports%rowtype;
  v_existing public.report_moderation_actions%rowtype;
  v_next_verification public.verification_status;
  v_next_operational public.operational_status;
  v_public_body text;
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
  if p_action not in ('approve', 'resolve', 'reject') then
    raise exception 'invalid_moderation_action';
  end if;
  if p_action in ('resolve', 'reject') and nullif(trim(p_reason), '') is null then
    raise exception 'moderation_reason_required';
  end if;
  if p_reason is not null and char_length(trim(p_reason)) > 500 then
    raise exception 'moderation_reason_too_long';
  end if;

  select * into v_existing
  from public.report_moderation_actions a
  where a.actor_id = v_user_id and a.idempotency_key = p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.case_id <> p_case_id or v_existing.action <> p_action then
      raise exception 'idempotency_key_conflict';
    end if;
    return query select
      v_existing.case_id,
      v_existing.report_id,
      v_existing.action,
      'resolved'::text,
      v_existing.result_verification_status,
      v_existing.result_operational_status;
    return;
  end if;

  select * into v_case
  from public.moderation_cases
  where id = p_case_id
  for update;
  if v_case.id is null then
    raise exception 'moderation_case_not_found';
  end if;
  if v_case.status not in ('open', 'in_review') then
    raise exception 'moderation_case_resolved';
  end if;

  select * into v_report
  from public.reports
  where id = v_case.report_id
  for update;
  if v_report.id is null or v_report.operational_status not in ('active', 'monitoring', 'resolving') then
    raise exception 'report_not_moderatable';
  end if;

  perform set_config('app.moderation_reason', coalesce(nullif(trim(p_reason), ''), p_action), true);
  v_next_verification := v_report.verification_status;
  v_next_operational := v_report.operational_status;

  if p_action = 'approve' then
    v_next_verification := 'moderator_verified';
    v_public_body := 'Báo cáo đã được điều phối viên xác minh.';
    update public.reports
    set verification_status = v_next_verification, updated_at = now()
    where id = v_report.id;
  elsif p_action = 'resolve' then
    v_next_operational := 'resolved';
    v_public_body := 'Sự việc đã được điều phối viên xác nhận kết thúc.';
    update public.reports
    set operational_status = v_next_operational, resolved_at = now(), updated_at = now()
    where id = v_report.id;
  else
    v_next_operational := 'rejected';
    update public.reports
    set operational_status = v_next_operational, updated_at = now()
    where id = v_report.id;
  end if;

  update public.moderation_cases
  set status = 'resolved',
      resolution = p_action,
      resolution_reason = nullif(trim(p_reason), ''),
      assigned_to = v_user_id,
      resolved_by = v_user_id,
      resolved_at = now()
  where id = v_case.id;

  if p_action <> 'reject' then
    insert into public.report_updates (
      report_id,
      kind,
      body,
      operational_status,
      created_by,
      idempotency_key,
      published_at
    ) values (
      v_report.id,
      case
        when p_action = 'resolve' then 'status_change'::public.report_update_kind
        else 'note'::public.report_update_kind
      end,
      v_public_body,
      case when p_action = 'resolve' then 'resolved'::public.operational_status else null end,
      v_user_id,
      p_idempotency_key,
      now()
    )
    on conflict (report_id, idempotency_key) do nothing;
  end if;

  insert into public.report_moderation_actions (
    case_id,
    report_id,
    actor_id,
    action,
    reason,
    idempotency_key,
    result_verification_status,
    result_operational_status
  ) values (
    v_case.id,
    v_report.id,
    v_user_id,
    p_action,
    nullif(trim(p_reason), ''),
    p_idempotency_key,
    v_next_verification,
    v_next_operational
  );

  insert into public.notification_outbox (
    event_type,
    aggregate_type,
    aggregate_id,
    recipient_user_id,
    payload,
    dedupe_key
  ) values (
    case
      when p_action = 'resolve' then 'report_status_changed'::public.notification_event_type
      else 'report_updated'::public.notification_event_type
    end,
    'report',
    v_report.id,
    v_report.created_by,
    jsonb_build_object('reportId', v_report.id, 'kind', 'moderation_action', 'action', p_action),
    'report-moderated:' || v_case.id::text
  )
  on conflict (dedupe_key) do nothing;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    v_user_id,
    'report.moderated.' || p_action,
    'report',
    v_report.id,
    jsonb_build_object('caseId', v_case.id, 'reason', nullif(trim(p_reason), ''), 'idempotencyKey', p_idempotency_key)
  );

  return query select
    v_case.id,
    v_report.id,
    p_action,
    'resolved'::text,
    v_next_verification,
    v_next_operational;
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
      when 'official_verified' then 5
      when 'moderator_verified' then 4
      when 'community_verified' then 3
      when 'unverified' then 2
      else 1
    end desc
  limit 1000;
$$;

alter table public.report_moderation_actions enable row level security;
create policy "moderators read report moderation actions"
  on public.report_moderation_actions
  for select to authenticated
  using (public.is_moderator());

revoke all on public.report_moderation_actions from anon, authenticated;
grant select on public.report_moderation_actions to authenticated;
revoke all on function public.ensure_report_moderation_case from public;
revoke all on function public.get_report_moderation_queue from public;
revoke all on function public.moderate_report_case from public;
grant execute on function public.get_report_moderation_queue to authenticated;
grant execute on function public.moderate_report_case to authenticated;

comment on table public.report_moderation_actions is
  'Immutable idempotency and audit source for moderator report decisions; reasons are never public.';
comment on function public.get_report_moderation_queue is
  'Returns a reporter-safe queue to authenticated moderators only.';
comment on function public.moderate_report_case is
  'Applies idempotent moderator approve, resolve, or reject transitions and records private reasons.';
