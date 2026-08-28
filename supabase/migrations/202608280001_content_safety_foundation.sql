create type public.moderation_status as enum (
  'pending_review',
  'in_review',
  'approved',
  'rejected',
  'fact_checking',
  'legal_review',
  'removed'
);

create type public.visibility_status as enum ('public', 'labeled', 'limited', 'hidden');

create type public.removal_reason as enum (
  'false_information',
  'privacy_violation',
  'defamation',
  'dangerous_content',
  'incorrect_location',
  'copyright',
  'government_request',
  'court_order',
  'spam',
  'duplicate',
  'other'
);

create type public.report_source_type as enum (
  'community_eyewitness',
  'photo_evidence',
  'video_evidence',
  'official_notice',
  'government_open_data',
  'news_report',
  'organization_statement',
  'other'
);

create type public.source_verification_status as enum (
  'unverified',
  'verified',
  'disputed',
  'revoked'
);

create type public.content_flag_reason as enum (
  'false_information',
  'incorrect_location',
  'outdated',
  'privacy_violation',
  'defamation',
  'fake_official_source',
  'dangerous_content',
  'spam',
  'copyright',
  'other'
);

create type public.content_flag_status as enum ('open', 'in_review', 'resolved', 'dismissed');

alter table public.reports
  add column moderation_status public.moderation_status not null default 'pending_review',
  add column visibility_status public.visibility_status not null default 'labeled',
  add column removal_reason public.removal_reason,
  add column public_explanation text,
  add column moderated_at timestamptz,
  add constraint reports_public_explanation_length
    check (public_explanation is null or char_length(public_explanation) between 1 and 500);

update public.reports
set
  moderation_status = case
    when operational_status = 'rejected' then 'rejected'::public.moderation_status
    when verification_status in ('moderator_verified', 'official_verified') then 'approved'::public.moderation_status
    else 'pending_review'::public.moderation_status
  end,
  visibility_status = case
    when operational_status = 'rejected' then 'hidden'::public.visibility_status
    when verification_status in ('moderator_verified', 'official_verified') then 'public'::public.visibility_status
    else 'labeled'::public.visibility_status
  end,
  removal_reason = case
    when operational_status = 'rejected' then 'other'::public.removal_reason
    else null
  end;

alter table public.reports
  add constraint reports_hidden_when_removed_check check (
    moderation_status not in ('rejected', 'removed') or visibility_status = 'hidden'
  ),
  add constraint reports_removal_reason_check check (
    moderation_status not in ('rejected', 'removed') or removal_reason is not null
  );

create index reports_publication_idx
  on public.reports (visibility_status, moderation_status, operational_status, starts_at desc);

create table public.report_sources (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  source_type public.report_source_type not null,
  title text,
  publisher text,
  author text,
  url text,
  archived_url text,
  published_at timestamptz,
  accessed_at timestamptz,
  submitted_by uuid references auth.users(id) on delete set null,
  verification_status public.source_verification_status not null default 'unverified',
  is_primary boolean not null default false,
  public_visible boolean not null default true,
  private_verification_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint report_sources_title_length check (title is null or char_length(title) between 1 and 240),
  constraint report_sources_publisher_length check (publisher is null or char_length(publisher) between 1 and 240),
  constraint report_sources_author_length check (author is null or char_length(author) between 1 and 240),
  constraint report_sources_url_length check (url is null or char_length(url) <= 2048),
  constraint report_sources_archived_url_length check (archived_url is null or char_length(archived_url) <= 2048)
);

create unique index report_sources_one_primary_idx
  on public.report_sources (report_id)
  where is_primary;
create index report_sources_report_idx on public.report_sources (report_id, created_at);

insert into public.report_sources (
  report_id,
  source_type,
  title,
  publisher,
  url,
  accessed_at,
  submitted_by,
  verification_status,
  is_primary
)
select
  r.id,
  case
    when r.source_id is not null then 'official_notice'::public.report_source_type
    else 'community_eyewitness'::public.report_source_type
  end,
  case when r.source_id is not null then s.name else 'Báo cáo từ cộng đồng' end,
  s.name,
  s.website_url,
  now(),
  r.created_by,
  case
    when r.source_id is not null and s.verified then 'verified'::public.source_verification_status
    else 'unverified'::public.source_verification_status
  end,
  true
from public.reports r
left join public.official_sources s on s.id = r.source_id;

create or replace function public.ensure_default_report_source()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.report_sources (
    report_id,
    source_type,
    title,
    publisher,
    url,
    accessed_at,
    submitted_by,
    verification_status,
    is_primary
  )
  select
    new.id,
    case
      when new.source_id is not null then 'official_notice'::public.report_source_type
      else 'community_eyewitness'::public.report_source_type
    end,
    case when new.source_id is not null then s.name else 'Báo cáo từ cộng đồng' end,
    s.name,
    s.website_url,
    now(),
    new.created_by,
    case
      when new.source_id is not null and s.verified then 'verified'::public.source_verification_status
      else 'unverified'::public.source_verification_status
    end,
    true
  from (select 1) seed
  left join public.official_sources s on s.id = new.source_id;
  return new;
end;
$$;

create trigger reports_ensure_default_source
after insert on public.reports
for each row execute function public.ensure_default_report_source();

create table public.content_flags (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason public.content_flag_reason not null,
  description text,
  status public.content_flag_status not null default 'open',
  risk_level smallint not null default 1 check (risk_level between 1 and 5),
  assigned_to uuid references auth.users(id) on delete set null,
  resolution_reason text,
  resolved_by uuid references auth.users(id) on delete set null,
  idempotency_key uuid not null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reporter_id, idempotency_key),
  constraint content_flags_description_length
    check (description is null or char_length(description) between 1 and 1000),
  constraint content_flags_other_description_check
    check (reason <> 'other' or description is not null)
);

create index content_flags_queue_idx
  on public.content_flags (risk_level desc, created_at asc)
  where status in ('open', 'in_review');
create index content_flags_report_idx on public.content_flags (report_id, status);

create trigger report_sources_set_updated_at
before update on public.report_sources
for each row execute function public.set_updated_at();

create trigger content_flags_set_updated_at
before update on public.content_flags
for each row execute function public.set_updated_at();

create or replace function public.submit_content_flag(
  p_report_id uuid,
  p_reason public.content_flag_reason,
  p_description text,
  p_idempotency_key uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_flag_id uuid;
  v_existing_report_id uuid;
  v_existing_reason public.content_flag_reason;
  v_risk_level smallint;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;
  if p_idempotency_key is null then
    raise exception 'idempotency_key_required';
  end if;
  if p_description is not null and char_length(trim(p_description)) > 1000 then
    raise exception 'description_too_long';
  end if;
  if p_reason = 'other' and nullif(trim(p_description), '') is null then
    raise exception 'description_required';
  end if;

  select id, report_id, reason
  into v_flag_id, v_existing_report_id, v_existing_reason
  from public.content_flags
  where reporter_id = v_user_id and idempotency_key = p_idempotency_key;
  if v_flag_id is not null then
    if v_existing_report_id <> p_report_id or v_existing_reason <> p_reason then
      raise exception 'idempotency_key_conflict';
    end if;
    return v_flag_id;
  end if;

  if not exists (
    select 1 from public.reports
    where id = p_report_id
      and operational_status <> 'rejected'
      and moderation_status not in ('rejected', 'removed')
      and visibility_status <> 'hidden'
  ) then
    raise exception 'report_not_flaggable';
  end if;

  v_risk_level := case p_reason
    when 'privacy_violation' then 5
    when 'defamation' then 5
    when 'fake_official_source' then 5
    when 'dangerous_content' then 5
    when 'false_information' then 4
    when 'copyright' then 4
    when 'incorrect_location' then 3
    when 'outdated' then 2
    when 'spam' then 2
    else 1
  end;

  insert into public.content_flags (
    report_id,
    reporter_id,
    reason,
    description,
    risk_level,
    idempotency_key
  ) values (
    p_report_id,
    v_user_id,
    p_reason,
    nullif(trim(p_description), ''),
    v_risk_level,
    p_idempotency_key
  ) returning id into v_flag_id;

  update public.reports
  set
    moderation_status = case
      when p_reason in ('false_information', 'fake_official_source') then 'fact_checking'::public.moderation_status
      else 'in_review'::public.moderation_status
    end,
    visibility_status = case
      when visibility_status = 'public' then 'labeled'::public.visibility_status
      else visibility_status
    end,
    updated_at = now()
  where id = p_report_id;

  insert into public.moderation_cases (report_id, priority, reason)
  values (p_report_id, v_risk_level, 'content_flag:' || p_reason::text)
  on conflict (report_id) where status in ('open', 'in_review')
  do update set
    priority = greatest(public.moderation_cases.priority, excluded.priority),
    reason = excluded.reason,
    updated_at = now();

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    v_user_id,
    'content_flag.created',
    'report',
    p_report_id,
    jsonb_build_object('flagId', v_flag_id, 'reason', p_reason, 'riskLevel', v_risk_level)
  );

  return v_flag_id;
end;
$$;

create or replace function public.sync_report_safety_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.verification_status in ('moderator_verified', 'official_verified')
    and old.verification_status is distinct from new.verification_status then
    new.moderation_status := 'approved';
    new.visibility_status := 'public';
    new.removal_reason := null;
    new.moderated_at := now();
  elsif new.operational_status = 'rejected'
    and old.operational_status is distinct from new.operational_status then
    new.moderation_status := 'rejected';
    new.visibility_status := 'hidden';
    new.removal_reason := coalesce(new.removal_reason, 'other');
    new.moderated_at := now();
  end if;
  return new;
end;
$$;

create trigger reports_sync_safety_state
before update of verification_status, operational_status on public.reports
for each row execute function public.sync_report_safety_state();

alter table public.report_status_history
  add column previous_moderation_status public.moderation_status,
  add column next_moderation_status public.moderation_status,
  add column previous_visibility_status public.visibility_status,
  add column next_visibility_status public.visibility_status,
  add column removal_reason public.removal_reason;

drop trigger reports_capture_status_history on public.reports;

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
    previous_moderation_status,
    next_moderation_status,
    previous_visibility_status,
    next_visibility_status,
    removal_reason,
    reason,
    actor_id
  ) values (
    new.id,
    old.verification_status,
    new.verification_status,
    old.operational_status,
    new.operational_status,
    old.moderation_status,
    new.moderation_status,
    old.visibility_status,
    new.visibility_status,
    new.removal_reason,
    nullif(current_setting('app.moderation_reason', true), ''),
    auth.uid()
  );
  return new;
end;
$$;

create trigger reports_capture_status_history
after update of verification_status, operational_status, moderation_status, visibility_status, removal_reason
on public.reports
for each row
when (
  old.verification_status is distinct from new.verification_status
  or old.operational_status is distinct from new.operational_status
  or old.moderation_status is distinct from new.moderation_status
  or old.visibility_status is distinct from new.visibility_status
  or old.removal_reason is distinct from new.removal_reason
)
execute function public.capture_report_status_history();

drop view public.public_report_details;

create view public.public_report_details
with (security_barrier = true)
as
select
  r.id,
  r.type,
  c.slug as category_slug,
  c.name as category_name,
  r.title,
  r.description,
  extensions.st_x(extensions.st_centroid(r.geometry)) as longitude,
  extensions.st_y(extensions.st_centroid(r.geometry)) as latitude,
  r.address_label,
  r.severity,
  r.verification_status,
  r.operational_status,
  r.moderation_status,
  r.visibility_status,
  r.starts_at,
  r.expires_at,
  r.confirmation_count,
  legacy_source.name as source_label,
  coalesce(source_rows.sources, '[]'::jsonb) as sources,
  coalesce(media_rows.media_urls, '{}'::text[]) as media_urls,
  r.created_at
from public.reports r
join public.categories c on c.id = r.category_id
left join public.official_sources legacy_source on legacy_source.id = r.source_id
left join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'id', source.id,
      'type', source.source_type,
      'title', source.title,
      'publisher', source.publisher,
      'author', source.author,
      'url', source.url,
      'publishedAt', source.published_at,
      'accessedAt', source.accessed_at,
      'verificationStatus', source.verification_status,
      'primary', source.is_primary
    ) order by source.is_primary desc, source.created_at
  ) as sources
  from public.report_sources source
  where source.report_id = r.id and source.public_visible
) source_rows on true
left join lateral (
  select array_agg(media.thumbnail_path order by media.created_at) as media_urls
  from public.report_media media
  where media.report_id = r.id
    and media.moderation_status = 'approved'
    and media.thumbnail_path is not null
) media_rows on true
where r.operational_status <> 'rejected'
  and r.moderation_status not in ('rejected', 'removed')
  and r.visibility_status <> 'hidden';

drop function public.get_map_items(
  double precision,
  double precision,
  double precision,
  double precision,
  text[],
  double precision,
  double precision,
  double precision
);

create function public.get_map_items(
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
  moderation_status public.moderation_status,
  visibility_status public.visibility_status,
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
    r.moderation_status,
    r.visibility_status,
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
    and r.moderation_status not in ('rejected', 'removed')
    and r.visibility_status <> 'hidden'
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

drop function public.get_report_moderation_queue();

create function public.get_report_moderation_queue()
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
  moderation_status public.moderation_status,
  visibility_status public.visibility_status,
  open_flag_count bigint,
  flag_reasons public.content_flag_reason[],
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
    moderation_case.id,
    report.id,
    report.type,
    category.name,
    report.title,
    report.description,
    report.address_label,
    report.severity,
    report.verification_status,
    report.operational_status,
    report.moderation_status,
    report.visibility_status,
    coalesce(flag_summary.flag_count, 0),
    coalesce(flag_summary.reasons, '{}'::public.content_flag_reason[]),
    report.confirmation_count,
    report.not_there_count,
    report.starts_at,
    report.expires_at,
    report.created_at,
    moderation_case.priority,
    moderation_case.status,
    moderation_case.reason
  from public.moderation_cases moderation_case
  join public.reports report on report.id = moderation_case.report_id
  join public.categories category on category.id = report.category_id
  left join lateral (
    select
      count(*) as flag_count,
      array_agg(distinct flag.reason) as reasons
    from public.content_flags flag
    where flag.report_id = report.id and flag.status in ('open', 'in_review')
  ) flag_summary on true
  where moderation_case.status in ('open', 'in_review')
    and report.operational_status in ('active', 'monitoring', 'resolving')
    and report.moderation_status not in ('approved', 'rejected', 'removed')
  order by
    moderation_case.priority desc,
    coalesce(flag_summary.flag_count, 0) desc,
    moderation_case.created_at asc
  limit 100;
end;
$$;

alter table public.report_sources enable row level security;
alter table public.content_flags enable row level security;

create policy "moderators read report sources" on public.report_sources
  for select to authenticated using (public.is_moderator());
create policy "users read own content flags" on public.content_flags
  for select to authenticated using (reporter_id = auth.uid() or public.is_moderator());

revoke all on public.report_sources, public.content_flags from anon, authenticated;
grant select on public.report_sources to authenticated;
grant select on public.content_flags to authenticated;
grant select on public.public_report_details to anon, authenticated;

revoke all on function public.ensure_default_report_source from public;
revoke all on function public.submit_content_flag from public;
revoke all on function public.sync_report_safety_state from public;
revoke all on function public.get_report_moderation_queue from public;
grant execute on function public.submit_content_flag to authenticated;
grant execute on function public.get_map_items to anon, authenticated;
grant execute on function public.get_report_moderation_queue to authenticated;

comment on table public.report_sources is
  'Normalized provenance records. Public views exclude submitter identity and private verification notes.';
comment on table public.content_flags is
  'Authenticated safety flags kept private from public report payloads.';
comment on function public.submit_content_flag is
  'Authenticated idempotent safety flag command that prioritizes moderation without allowing a flagger to hide content.';
comment on view public.public_report_details is
  'Identity-safe public report details with structured provenance and no hidden or removed reports.';
