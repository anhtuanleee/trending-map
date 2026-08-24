create extension if not exists postgis with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create type public.report_type as enum ('incident', 'scheduled_event', 'area_alert');
create type public.severity as enum ('info', 'low', 'medium', 'high', 'critical');
create type public.verification_status as enum (
  'unverified',
  'community_verified',
  'official_verified',
  'disputed'
);
create type public.operational_status as enum (
  'active',
  'monitoring',
  'resolved',
  'expired',
  'rejected'
);
create type public.confirmation_kind as enum ('seen', 'not_there', 'incorrect');
create type public.app_role as enum ('member', 'trusted', 'official', 'moderator');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  trust_level smallint not null default 0 check (trust_level between 0 and 100),
  contribution_suspended_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  organization_id uuid,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  report_type public.report_type not null,
  icon text not null,
  default_expiry_minutes integer not null check (default_expiry_minutes > 0),
  duplicate_radius_meters integer not null check (duplicate_radius_meters > 0),
  duplicate_window_minutes integer not null check (duplicate_window_minutes > 0),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.official_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_type text not null,
  website_url text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  type public.report_type not null,
  category_id uuid not null references public.categories(id),
  title text not null check (char_length(title) between 6 and 120),
  description text not null check (char_length(description) between 12 and 1200),
  severity public.severity not null default 'info',
  verification_status public.verification_status not null default 'unverified',
  operational_status public.operational_status not null default 'active',
  geometry extensions.geometry(Geometry, 4326) not null,
  address_label text,
  source_id uuid references public.official_sources(id),
  created_by uuid references auth.users(id) on delete set null,
  anonymous_publicly boolean not null default false,
  idempotency_key uuid,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  expires_at timestamptz,
  resolved_at timestamptz,
  confirmation_count integer not null default 0,
  not_there_count integer not null default 0,
  trust_score_internal numeric(6, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_event_end_required check (type <> 'scheduled_event' or ends_at is not null),
  constraint reports_idempotency_unique unique (created_by, idempotency_key)
);

create index reports_geometry_gix on public.reports using gist (geometry);
create index reports_active_time_idx
  on public.reports (operational_status, starts_at desc)
  where operational_status in ('active', 'monitoring');
create index reports_category_time_idx on public.reports (category_id, starts_at desc);

create table public.report_media (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  storage_path text not null,
  thumbnail_path text,
  mime_type text not null,
  width integer,
  height integer,
  moderation_status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.report_confirmations (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind public.confirmation_kind not null,
  observed_geometry extensions.geometry(Point, 4326),
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (report_id, user_id),
  unique (user_id, idempotency_key)
);

create table public.report_comments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  hidden_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.report_status_history (
  id bigint generated always as identity primary key,
  report_id uuid not null references public.reports(id) on delete cascade,
  previous_verification_status public.verification_status,
  next_verification_status public.verification_status,
  previous_operational_status public.operational_status,
  next_operational_status public.operational_status,
  reason text,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.followed_areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  geometry extensions.geometry(Polygon, 4326) not null,
  category_slugs text[] not null default '{}',
  minimum_severity public.severity not null default 'medium',
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create index followed_areas_geometry_gix on public.followed_areas using gist (geometry);

create table public.push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null unique,
  platform text not null check (platform in ('ios', 'android')),
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.moderation_cases (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  status text not null default 'open',
  priority smallint not null default 0,
  reason text,
  assigned_to uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, 'Người dùng ' || right(new.id::text, 4));
  insert into public.user_roles (user_id, role) values (new.id, 'member');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'moderator'
  );
$$;

create or replace function public.submit_report(
  p_type public.report_type,
  p_category_id uuid,
  p_title text,
  p_description text,
  p_severity public.severity,
  p_longitude double precision,
  p_latitude double precision,
  p_address_label text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_anonymous_publicly boolean,
  p_idempotency_key uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_report_id uuid;
  v_expiry_minutes integer;
  v_suspended_until timestamptz;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;
  if p_longitude not between -180 and 180 or p_latitude not between -90 and 90 then
    raise exception 'invalid_coordinate';
  end if;

  select contribution_suspended_until into v_suspended_until
  from public.profiles where id = v_user_id;
  if v_suspended_until is not null and v_suspended_until > now() then
    raise exception 'contribution_suspended';
  end if;

  select id into v_report_id
  from public.reports
  where created_by = v_user_id and idempotency_key = p_idempotency_key;
  if v_report_id is not null then
    return v_report_id;
  end if;

  select default_expiry_minutes into v_expiry_minutes
  from public.categories
  where id = p_category_id and enabled = true and report_type = p_type;
  if v_expiry_minutes is null then
    raise exception 'invalid_category';
  end if;

  insert into public.reports (
    type, category_id, title, description, severity, geometry, address_label,
    created_by, anonymous_publicly, idempotency_key, starts_at, ends_at, expires_at
  ) values (
    p_type, p_category_id, trim(p_title), trim(p_description), p_severity,
    st_setsrid(st_makepoint(p_longitude, p_latitude), 4326), p_address_label,
    v_user_id, p_anonymous_publicly, p_idempotency_key, p_starts_at, p_ends_at,
    case when p_type = 'scheduled_event' then p_ends_at else p_starts_at + make_interval(mins => v_expiry_minutes) end
  ) returning id into v_report_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id)
  values (v_user_id, 'report.created', 'report', v_report_id);

  return v_report_id;
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
      when verification_status = 'official_verified' then verification_status
      when v_not_there >= greatest(3, v_seen) then 'disputed'
      when v_seen >= 3 then 'community_verified'
      else 'unverified'
    end,
    updated_at = now()
  where id = p_report_id;
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
    where id = p_report_id and operational_status in ('active', 'monitoring')
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
  p_category_slugs text[] default '{}'
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
  confirmation_count integer
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    r.id, r.type, c.slug, c.name, r.title,
    st_x(st_centroid(r.geometry)), st_y(st_centroid(r.geometry)),
    r.severity, r.verification_status, r.operational_status,
    r.starts_at, r.expires_at, r.confirmation_count
  from public.reports r
  join public.categories c on c.id = r.category_id
  where r.operational_status in ('active', 'monitoring')
    and (r.expires_at is null or r.expires_at > now())
    and r.geometry && st_makeenvelope(p_west, p_south, p_east, p_north, 4326)
    and (cardinality(p_category_slugs) = 0 or c.slug = any(p_category_slugs))
  order by r.severity desc, r.starts_at desc
  limit 1000;
$$;

create or replace view public.public_report_details
with (security_barrier = true)
as
select
  r.id,
  r.type,
  c.slug as category_slug,
  c.name as category_name,
  r.title,
  r.description,
  st_x(st_centroid(r.geometry)) as longitude,
  st_y(st_centroid(r.geometry)) as latitude,
  r.address_label,
  r.severity,
  r.verification_status,
  r.operational_status,
  r.starts_at,
  r.expires_at,
  r.confirmation_count,
  s.name as source_label,
  coalesce(
    array_agg(m.thumbnail_path order by m.created_at) filter (where m.thumbnail_path is not null),
    '{}'::text[]
  ) as media_urls,
  r.created_at
from public.reports r
join public.categories c on c.id = r.category_id
left join public.official_sources s on s.id = r.source_id
left join public.report_media m on m.report_id = r.id and m.moderation_status = 'approved'
where r.operational_status not in ('rejected')
group by r.id, c.slug, c.name, s.name;

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
  where operational_status in ('active', 'monitoring')
    and expires_at is not null
    and expires_at <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.categories enable row level security;
alter table public.official_sources enable row level security;
alter table public.reports enable row level security;
alter table public.report_media enable row level security;
alter table public.report_confirmations enable row level security;
alter table public.report_comments enable row level security;
alter table public.report_status_history enable row level security;
alter table public.followed_areas enable row level security;
alter table public.push_devices enable row level security;
alter table public.moderation_cases enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles readable by owner" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_moderator());
create policy "profiles editable by owner" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "categories publicly readable" on public.categories
  for select to anon, authenticated using (enabled = true);
create policy "users read own confirmations" on public.report_confirmations
  for select to authenticated using (user_id = auth.uid());
create policy "users read own followed areas" on public.followed_areas
  for select to authenticated using (user_id = auth.uid());
create policy "users manage own followed areas" on public.followed_areas
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users manage own push devices" on public.push_devices
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "moderators read cases" on public.moderation_cases
  for select to authenticated using (public.is_moderator());
create policy "moderators read audit logs" on public.audit_logs
  for select to authenticated using (public.is_moderator());

revoke all on all tables in schema public from anon, authenticated;
grant select on public.categories to anon, authenticated;
grant select on public.public_report_details to anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;
grant select on public.report_confirmations to authenticated;
grant select, insert, update, delete on public.followed_areas to authenticated;
grant select, insert, update, delete on public.push_devices to authenticated;
grant select on public.moderation_cases, public.audit_logs to authenticated;

revoke all on function public.submit_report from public;
revoke all on function public.confirm_report from public;
revoke all on function public.expire_stale_reports from public;
revoke all on function public.handle_new_user from public;
revoke all on function public.recalculate_report_counts from public;
grant execute on function public.submit_report to authenticated;
grant execute on function public.confirm_report to authenticated;
grant execute on function public.get_map_items to anon, authenticated;

comment on function public.get_map_items is 'Public viewport query returning no reporter identity.';
comment on view public.public_report_details is 'Public report details excluding reporter identity and internal trust data.';
