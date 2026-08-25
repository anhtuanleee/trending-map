begin;
select plan(10);

select has_function('public', 'get_report_media_moderation_queue', 'moderation queue RPC exists');
select has_function('public', 'prepare_report_media_moderation', 'moderation claim RPC exists');
select has_function('public', 'complete_report_media_moderation', 'publication finalizer exists');
select has_function('public', 'release_report_media_moderation_claim', 'failed publication can release its claim');
select has_column('public', 'report_media', 'public_storage_path', 'public object path is tracked');
select has_column('public', 'report_media', 'moderated_by', 'moderator actor is tracked privately');
select has_column('public', 'report_media', 'moderation_idempotency_key', 'moderation command is idempotent');

select is(
  (select public from storage.buckets where id = 'report-evidence-public'),
  true,
  'approved evidence bucket is publicly readable'
);

select is(
  (
    select count(*)::integer
    from information_schema.routine_privileges
    where grantee = 'anon'
      and routine_schema = 'public'
      and routine_name in (
        'get_report_media_moderation_queue',
        'prepare_report_media_moderation',
        'complete_report_media_moderation',
        'release_report_media_moderation_claim'
      )
      and privilege_type = 'EXECUTE'
  ),
  0,
  'anonymous users cannot access moderation RPCs'
);

select is(
  (
    select count(*)::integer
    from information_schema.routine_privileges
    where grantee = 'authenticated'
      and routine_schema = 'public'
      and routine_name in ('complete_report_media_moderation', 'release_report_media_moderation_claim')
      and privilege_type = 'EXECUTE'
  ),
  0,
  'client roles cannot finalize or compensate publication'
);

select * from finish();
rollback;
