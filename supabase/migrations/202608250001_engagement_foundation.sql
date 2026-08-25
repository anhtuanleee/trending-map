alter type public.operational_status add value if not exists 'resolving' after 'monitoring';

create type public.report_update_kind as enum (
  'note',
  'status_change',
  'official_update',
  'evidence_added'
);

create type public.notification_event_type as enum (
  'report_created',
  'report_updated',
  'report_status_changed',
  'official_alert',
  'event_reminder'
);

create type public.notification_delivery_status as enum (
  'pending',
  'processing',
  'sent',
  'failed'
);

create type public.saved_item_kind as enum ('report', 'event');

create type public.feature_rollout_key as enum (
  'live_incident_timeline',
  'photo_evidence_upload',
  'followed_area_push_alerts',
  'duplicate_report_merge',
  'local_pulse_feed',
  'event_save_reminder_share',
  'official_data_layers',
  'contributor_reputation'
);

create type public.feature_rollout_audience as enum (
  'all',
  'authenticated',
  'plus',
  'internal'
);

create table public.report_updates (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  kind public.report_update_kind not null,
  body text check (body is null or char_length(body) between 1 and 1000),
  operational_status public.operational_status,
  created_by uuid references auth.users(id) on delete set null,
  source_id uuid references public.official_sources(id) on delete set null,
  idempotency_key uuid not null,
  published_at timestamptz,
  hidden_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (report_id, idempotency_key),
  check (body is not null or operational_status is not null),
  check (kind <> 'official_update' or source_id is not null)
);

create index report_updates_public_timeline_idx
  on public.report_updates (report_id, published_at desc)
  where published_at is not null and hidden_at is null;

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  event_type public.notification_event_type not null,
  aggregate_type text not null check (aggregate_type in ('report', 'followed_area', 'event')),
  aggregate_id uuid,
  recipient_user_id uuid references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  dedupe_key text not null unique check (char_length(dedupe_key) between 1 and 240),
  delivery_status public.notification_delivery_status not null default 'pending',
  attempt_count integer not null default 0 check (attempt_count between 0 and 20),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  processed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notification_outbox_pending_idx
  on public.notification_outbox (available_at, created_at)
  where delivery_status in ('pending', 'failed') and processed_at is null;

create table public.user_saved_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type public.saved_item_kind not null,
  item_id uuid not null references public.reports(id) on delete cascade,
  reminder_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id)
);

create index user_saved_items_reminder_idx
  on public.user_saved_items (reminder_at)
  where reminder_at is not null;

create table public.feature_rollouts (
  feature_key public.feature_rollout_key primary key,
  enabled boolean not null default false,
  audience public.feature_rollout_audience not null default 'all',
  rollout_config jsonb not null default '{}'::jsonb check (jsonb_typeof(rollout_config) = 'object'),
  starts_at timestamptz,
  ends_at timestamptz,
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

insert into public.feature_rollouts (feature_key)
select unnest(enum_range(null::public.feature_rollout_key));

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

create trigger report_updates_set_updated_at
before update on public.report_updates
for each row execute function public.set_updated_at();

create trigger notification_outbox_set_updated_at
before update on public.notification_outbox
for each row execute function public.set_updated_at();

create trigger user_saved_items_set_updated_at
before update on public.user_saved_items
for each row execute function public.set_updated_at();

create trigger feature_rollouts_set_updated_at
before update on public.feature_rollouts
for each row execute function public.set_updated_at();

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
    actor_id
  ) values (
    new.id,
    old.verification_status,
    new.verification_status,
    old.operational_status,
    new.operational_status,
    auth.uid()
  );

  return new;
end;
$$;

create trigger reports_capture_status_history
after update of verification_status, operational_status on public.reports
for each row
when (
  old.verification_status is distinct from new.verification_status
  or old.operational_status is distinct from new.operational_status
)
execute function public.capture_report_status_history();

create or replace view public.public_report_timeline
with (security_barrier = true)
as
select
  u.id,
  u.report_id,
  u.kind,
  u.body,
  u.operational_status,
  (u.source_id is not null) as official,
  s.name as source_label,
  u.published_at as created_at
from public.report_updates u
join public.reports r on r.id = u.report_id
left join public.official_sources s on s.id = u.source_id
where u.published_at is not null
  and u.hidden_at is null
  and r.operational_status <> 'rejected';

create or replace function public.get_feature_rollouts()
returns table (
  feature_key public.feature_rollout_key,
  enabled boolean,
  rollout_config jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    f.feature_key,
    (
      f.enabled
      and (f.starts_at is null or f.starts_at <= now())
      and (f.ends_at is null or f.ends_at > now())
      and case f.audience
        when 'all' then true
        when 'authenticated' then auth.uid() is not null
        when 'plus' then exists (
          select 1
          from public.subscription_entitlements e
          where e.user_id = auth.uid()
            and e.tier = 'plus'
            and e.status in ('trialing', 'active', 'grace_period')
        )
        when 'internal' then public.is_moderator()
      end
    ) as enabled,
    f.rollout_config
  from public.feature_rollouts f
  order by f.feature_key;
$$;

alter table public.report_updates enable row level security;
alter table public.notification_outbox enable row level security;
alter table public.user_saved_items enable row level security;
alter table public.feature_rollouts enable row level security;

create policy "users read own unpublished report updates"
  on public.report_updates
  for select to authenticated
  using (created_by = auth.uid() or public.is_moderator());

create policy "users manage own saved items"
  on public.user_saved_items
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "moderators read report status history"
  on public.report_status_history
  for select to authenticated
  using (public.is_moderator());

revoke all on public.report_updates from anon, authenticated;
revoke all on public.notification_outbox from anon, authenticated;
revoke all on public.user_saved_items from anon, authenticated;
revoke all on public.feature_rollouts from anon, authenticated;
revoke all on public.report_status_history from anon, authenticated;
revoke all on public.public_report_timeline from anon, authenticated;

grant select on public.public_report_timeline to anon, authenticated;
grant select on public.report_updates to authenticated;
grant select, insert, update, delete on public.user_saved_items to authenticated;
grant select on public.report_status_history to authenticated;

revoke all on function public.set_updated_at from public;
revoke all on function public.capture_report_status_history from public;
revoke all on function public.get_feature_rollouts from public;
grant execute on function public.get_feature_rollouts to anon, authenticated;

comment on table public.notification_outbox is
  'Server-only idempotent delivery queue. Mobile roles have no direct access.';
comment on table public.feature_rollouts is
  'Server-owned feature rollout controls. New engagement features default to disabled.';
comment on view public.public_report_timeline is
  'Published report timeline without reporter identity, trust internals, or moderation metadata.';
comment on function public.get_feature_rollouts is
  'Returns client-safe effective rollout values; flags never replace backend authorization.';
