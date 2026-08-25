begin;
select plan(8);

select has_function('public', 'get_report_timeline', 'public timeline RPC exists');
select has_function('public', 'can_update_report', 'private update capability RPC exists');
select has_function('public', 'add_report_update', 'authenticated timeline command exists');
select has_index('public', 'reports', 'reports_active_time_idx', 'resolving reports use active index');

select is(
  (
    select count(*)::integer
    from information_schema.routine_privileges
    where grantee = 'anon'
      and routine_schema = 'public'
      and routine_name = 'add_report_update'
      and privilege_type = 'EXECUTE'
  ),
  0,
  'anonymous users cannot add report updates'
);

select is(
  (
    select count(*)::integer
    from information_schema.routine_privileges
    where grantee = 'anon'
      and routine_schema = 'public'
      and routine_name = 'can_update_report'
      and privilege_type = 'EXECUTE'
  ),
  0,
  'anonymous users cannot probe report ownership'
);

select is(
  (
    select count(*)::integer
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'public_report_timeline'
      and column_name = 'created_by'
  ),
  0,
  'timeline payload does not expose its actor'
);

select ok(
  exists (
    select 1
    from unnest(enum_range(null::public.operational_status)) status
    where status::text = 'resolving'
  ),
  'operational status includes resolving'
);

select * from finish();
rollback;
