drop function if exists public.get_map_items(
  double precision,
  double precision,
  double precision,
  double precision,
  text[]
);

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
  where r.operational_status in ('active', 'monitoring')
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

revoke all on function public.get_map_items from public;
grant execute on function public.get_map_items to anon, authenticated;

comment on function public.get_map_items is
  'Public bounded map query with optional distance ordering and no reporter identity.';
