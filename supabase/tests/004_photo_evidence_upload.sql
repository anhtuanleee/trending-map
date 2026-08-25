begin;
select plan(8);

select has_function('public', 'prepare_report_media_upload', 'media reservation RPC exists');
select has_function('public', 'complete_report_media_upload', 'media completion RPC exists');
select has_column('public', 'report_media', 'created_by', 'media tracks private contributor');
select has_column('public', 'report_media', 'upload_status', 'media tracks upload lifecycle');
select has_column('public', 'report_media', 'file_size_bytes', 'media size is persisted');

select is(
  (select public from storage.buckets where id = 'report-evidence-private'),
  false,
  'evidence staging bucket is private'
);

select is(
  (select file_size_limit::bigint from storage.buckets where id = 'report-evidence-private'),
  5000000::bigint,
  'private bucket enforces five megabyte limit'
);

select is(
  (
    select count(*)::integer
    from information_schema.routine_privileges
    where grantee = 'anon'
      and routine_schema = 'public'
      and routine_name in ('prepare_report_media_upload', 'complete_report_media_upload')
      and privilege_type = 'EXECUTE'
  ),
  0,
  'anonymous users cannot create or complete uploads'
);

select * from finish();
rollback;
