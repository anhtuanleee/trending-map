create type public.subscription_tier as enum ('free', 'plus');
create type public.subscription_status as enum (
  'inactive',
  'trialing',
  'active',
  'grace_period',
  'past_due',
  'expired',
  'revoked'
);
create type public.subscription_source as enum ('app_store', 'play_store', 'web', 'manual');

create table public.subscription_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier public.subscription_tier not null default 'free',
  status public.subscription_status not null default 'inactive',
  source public.subscription_source,
  product_id text,
  original_transaction_id text unique,
  current_period_ends_at timestamptz,
  will_renew boolean not null default false,
  provider_payload_updated_at timestamptz,
  updated_at timestamptz not null default now(),
  check (tier = 'free' or source is not null)
);

create index subscription_entitlements_status_idx
  on public.subscription_entitlements (status, current_period_ends_at);

alter table public.subscription_entitlements enable row level security;

create policy "users read own subscription entitlement"
  on public.subscription_entitlements
  for select to authenticated
  using (user_id = auth.uid());

revoke all on public.subscription_entitlements from anon, authenticated;
grant select on public.subscription_entitlements to authenticated;

comment on table public.subscription_entitlements is
  'Server-owned subscription mirror. Mobile users may read their own row; only trusted billing webhook/service-role code may write.';
