insert into public.categories (
  id, slug, name, report_type, icon, default_expiry_minutes,
  duplicate_radius_meters, duplicate_window_minutes
) values
  ('24beceab-c7c1-407d-a0ab-b32ac358e4ec', 'flood', 'Ngập nước', 'incident', 'waves', 120, 100, 120),
  ('70f09943-78ac-4403-9225-4cc4be183493', 'pothole', 'Ổ gà', 'incident', 'triangle-alert', 43200, 20, 43200),
  ('58124383-1393-4079-b125-bdbac0b5c781', 'music', 'Âm nhạc', 'scheduled_event', 'music', 480, 150, 10080),
  ('6a36903a-19e9-4355-80df-5f85d6910164', 'storm', 'Mưa bão', 'area_alert', 'cloud-lightning', 360, 5000, 360)
on conflict (id) do nothing;

insert into public.official_sources (id, name, source_type, verified)
values ('151ba1d2-d289-480e-b4b2-03ae79787c04', 'Ban tổ chức đã xác minh', 'organizer', true)
on conflict (id) do nothing;

insert into public.reports (
  id, type, category_id, title, description, severity, verification_status,
  geometry, address_label, starts_at, ends_at, expires_at, confirmation_count
) values (
  '2e130699-a737-4942-bf43-f9f217bdf84b', 'incident',
  '24beceab-c7c1-407d-a0ab-b32ac358e4ec', 'Ngập sâu trên đường Nguyễn Huệ',
  'Nước dâng gần nửa bánh xe, làn sát vỉa hè đang khó di chuyển.', 'high',
  'community_verified', st_setsrid(st_makepoint(106.7034, 10.7731), 4326),
  'Nguyễn Huệ, Bến Nghé, Quận 1', now() - interval '8 minutes', null, now() + interval '2 hours', 14
), (
  '42a37a67-b480-4809-8658-97cfcbd34c63', 'incident',
  '70f09943-78ac-4403-9225-4cc4be183493', 'Ổ gà lớn sát giao lộ',
  'Ổ gà nằm ở làn xe máy, khó quan sát khi trời mưa.', 'medium',
  'unverified', st_setsrid(st_makepoint(106.6958, 10.7826), 4326),
  'Hai Bà Trưng, Quận 1', now() - interval '30 minutes', null, now() + interval '30 days', 1
), (
  'cd57f70e-57b9-469c-b460-8b9a727ed97e', 'scheduled_event',
  '58124383-1393-4079-b125-bdbac0b5c781', 'Đêm nhạc bên bờ sông',
  'Sân khấu cộng đồng ngoài trời, mở cửa tự do từ 19:00.', 'info',
  'official_verified', st_setsrid(st_makepoint(106.7095, 10.7713), 4326),
  'Công viên Bến Bạch Đằng, Quận 1', now() + interval '4 hours', now() + interval '8 hours',
  now() + interval '8 hours', 32
)
on conflict (id) do nothing;
