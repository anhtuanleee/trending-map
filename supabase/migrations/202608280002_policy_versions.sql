create type public.policy_document_kind as enum (
  'terms_of_service',
  'privacy_policy',
  'community_guidelines',
  'content_moderation_policy'
);

create table public.policy_versions (
  id uuid primary key default gen_random_uuid(),
  kind public.policy_document_kind not null,
  version text not null,
  locale text not null default 'vi',
  title text not null,
  document_url text not null,
  content_sha256 text not null,
  effective_at timestamptz not null,
  required_for_contribution boolean not null default true,
  published_at timestamptz,
  superseded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (kind, version, locale),
  constraint policy_versions_version_length check (char_length(version) between 1 and 40),
  constraint policy_versions_document_url_length check (char_length(document_url) <= 2048),
  constraint policy_versions_sha256_format check (content_sha256 ~ '^[0-9a-f]{64}$'),
  constraint policy_versions_publish_order check (
    published_at is null or published_at <= effective_at
  )
);

create unique index policy_versions_current_idx
  on public.policy_versions (kind, locale)
  where published_at is not null and superseded_at is null;

create table public.user_policy_acceptances (
  user_id uuid not null references auth.users(id) on delete cascade,
  policy_version_id uuid not null references public.policy_versions(id) on delete restrict,
  accepted_at timestamptz not null default now(),
  primary key (user_id, policy_version_id)
);

create or replace function public.accept_policy_version(p_policy_version_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;
  if not exists (
    select 1
    from public.policy_versions
    where id = p_policy_version_id
      and published_at is not null
      and superseded_at is null
  ) then
    raise exception 'policy_version_not_current';
  end if;

  insert into public.user_policy_acceptances (user_id, policy_version_id)
  values (v_user_id, p_policy_version_id)
  on conflict do nothing;
  return true;
end;
$$;

create or replace function public.get_current_policy_versions(p_locale text default 'vi')
returns table (
  id uuid,
  kind public.policy_document_kind,
  version text,
  locale text,
  title text,
  document_url text,
  effective_at timestamptz,
  required_for_contribution boolean,
  accepted boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    policy.id,
    policy.kind,
    policy.version,
    policy.locale,
    policy.title,
    policy.document_url,
    policy.effective_at,
    policy.required_for_contribution,
    auth.uid() is not null and exists (
      select 1
      from public.user_policy_acceptances acceptance
      where acceptance.user_id = auth.uid()
        and acceptance.policy_version_id = policy.id
    ) as accepted
  from public.policy_versions policy
  where policy.locale = p_locale
    and policy.published_at is not null
    and policy.superseded_at is null
  order by policy.kind;
$$;

alter table public.policy_versions enable row level security;
alter table public.user_policy_acceptances enable row level security;

create policy "published policies are publicly readable" on public.policy_versions
  for select to anon, authenticated
  using (published_at is not null and superseded_at is null);
create policy "users read own policy acceptances" on public.user_policy_acceptances
  for select to authenticated using (user_id = auth.uid());

revoke all on public.policy_versions, public.user_policy_acceptances from anon, authenticated;
grant select on public.policy_versions to anon, authenticated;
grant select on public.user_policy_acceptances to authenticated;
revoke all on function public.accept_policy_version from public;
revoke all on function public.get_current_policy_versions from public;
grant execute on function public.accept_policy_version to authenticated;
grant execute on function public.get_current_policy_versions to anon, authenticated;

comment on table public.policy_versions is
  'Immutable published policy metadata. Draft Markdown files are not inserted until legal approval and hosting.';
comment on table public.user_policy_acceptances is
  'Per-user acceptance ledger; contribution enforcement is enabled only after approved policies are published.';
