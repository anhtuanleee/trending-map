begin;
select plan(16);

select enum_has_labels(
  'public',
  'moderation_status',
  array['pending_review', 'in_review', 'approved', 'rejected', 'fact_checking', 'legal_review', 'removed'],
  'moderation workflow is separate from verification and operations'
);
select enum_has_labels(
  'public',
  'visibility_status',
  array['public', 'labeled', 'limited', 'hidden'],
  'public visibility is explicit'
);
select enum_has_labels(
  'public',
  'content_flag_status',
  array['open', 'in_review', 'resolved', 'dismissed'],
  'content flag lifecycle is explicit'
);

select has_table('public', 'report_sources', 'normalized report sources exist');
select has_table('public', 'content_flags', 'private content flags exist');
select has_table('public', 'policy_versions', 'versioned policy metadata exists');
select has_table('public', 'user_policy_acceptances', 'policy acceptance ledger exists');
select has_function('public', 'submit_content_flag', 'content flag command exists');
select has_function('public', 'accept_policy_version', 'policy acceptance command exists');
select has_column('public', 'reports', 'moderation_status', 'reports track moderation independently');
select has_column('public', 'reports', 'visibility_status', 'reports track public visibility independently');
select has_column('public', 'public_report_details', 'sources', 'public detail exposes structured provenance');

select is(
  (
    select count(*)::integer
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'public_report_details'
      and column_name in ('created_by', 'submitted_by', 'private_verification_notes', 'removal_reason')
  ),
  0,
  'public report detail excludes safety and provenance internals'
);

select is(
  (
    select count(*)::integer
    from information_schema.routine_privileges
    where grantee = 'anon'
      and routine_schema = 'public'
      and routine_name = 'submit_content_flag'
      and privilege_type = 'EXECUTE'
  ),
  0,
  'anonymous users cannot submit content flags'
);

select is(
  (
    select count(*)::integer
    from information_schema.table_privileges
    where grantee = 'anon'
      and table_schema = 'public'
      and table_name in ('content_flags', 'report_sources', 'user_policy_acceptances')
  ),
  0,
  'anonymous users cannot read private safety tables'
);

select is(
  (
    select count(*)::integer
    from information_schema.routine_privileges
    where grantee = 'authenticated'
      and routine_schema = 'public'
      and routine_name = 'submit_content_flag'
      and privilege_type = 'EXECUTE'
  ),
  1,
  'authenticated users can execute the idempotent flag command'
);

select * from finish();
rollback;
