begin;
select plan(10);

select enum_has_labels(
  'public',
  'verification_status',
  array['unverified', 'community_verified', 'moderator_verified', 'official_verified', 'disputed'],
  'verification provenance includes moderator without conflating official source'
);
select has_table('public', 'report_moderation_actions', 'moderation actions table exists');
select has_function('public', 'get_report_moderation_queue', 'report moderation queue RPC exists');
select has_function('public', 'moderate_report_case', 'report moderation command RPC exists');
select has_column('public', 'moderation_cases', 'resolution', 'case resolution is tracked');
select has_column('public', 'moderation_cases', 'resolution_reason', 'private resolution reason is tracked');
select has_column('public', 'moderation_cases', 'resolved_by', 'moderator actor is tracked');

select is(
  (
    select count(*)::integer
    from information_schema.routine_privileges
    where grantee = 'anon'
      and routine_schema = 'public'
      and routine_name in ('get_report_moderation_queue', 'moderate_report_case')
      and privilege_type = 'EXECUTE'
  ),
  0,
  'anonymous users cannot access report moderation RPCs'
);

select is(
  (
    select count(*)::integer
    from information_schema.table_privileges
    where grantee = 'anon'
      and table_schema = 'public'
      and table_name = 'report_moderation_actions'
  ),
  0,
  'anonymous users cannot read private moderation actions'
);

select is(
  (
    select count(*)::integer
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'public_report_details'
      and column_name in ('created_by', 'trust_score_internal', 'resolution_reason')
  ),
  0,
  'public report detail does not expose reporter, trust, or moderation reason'
);

select * from finish();
rollback;
