begin;
select plan(4);

select has_table('public', 'reports', 'reports table exists');
select has_index('public', 'reports', 'reports_geometry_gix', 'reports use a spatial index');
select has_function('public', 'submit_report', 'authenticated report command exists');
select has_function('public', 'get_map_items', 'public viewport query exists');

select * from finish();
rollback;
