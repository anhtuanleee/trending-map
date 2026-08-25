begin;
select plan(10);

select has_table('public', 'report_updates', 'report updates table exists');
select has_table('public', 'notification_outbox', 'notification outbox table exists');
select has_table('public', 'user_saved_items', 'saved items table exists');
select has_table('public', 'feature_rollouts', 'feature rollout table exists');
select has_view('public', 'public_report_timeline', 'safe public timeline view exists');
select has_function('public', 'get_feature_rollouts', 'rollout read boundary exists');
select has_trigger(
  'public',
  'reports',
  'reports_capture_status_history',
  'report status changes are recorded automatically'
);

select is(
  (select count(*)::integer from public.feature_rollouts where enabled),
  0,
  'engagement rollouts default to disabled'
);

select is(
  (
    select count(*)::integer
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'public_report_timeline'
      and column_name in ('created_by', 'trust_score_internal', 'hidden_at')
  ),
  0,
  'public timeline excludes identity, trust, and moderation fields'
);

select is(
  (
    select count(*)::integer
    from information_schema.role_table_grants
    where grantee in ('anon', 'authenticated')
      and table_schema = 'public'
      and table_name = 'notification_outbox'
  ),
  0,
  'mobile roles cannot access the delivery outbox'
);

select * from finish();
rollback;
