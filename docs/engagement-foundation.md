# Engagement foundation

Milestone `feat/(engagement-foundation)` chuẩn hóa các boundary dùng chung cho timeline, thông báo,
saved items và feature rollout. Đây là nền móng; các feature chưa được hiển thị cho người dùng cho
đến khi rollout tương ứng được bật.

## Shared contracts

`packages/contracts/src/engagement.ts` định nghĩa:

| Contract                  | Mục đích                                                                  |
| ------------------------- | ------------------------------------------------------------------------- |
| `ReportTimelineItem`      | Timeline công khai, không có reporter ID, trust score hoặc moderation.    |
| `ReportOperationalStatus` | Alias dùng chung cho lifecycle report, có thêm trạng thái `resolving`.    |
| `NotificationEvent`       | Event client-safe; delivery target và lỗi worker không nằm trong payload. |
| `SavedItem`               | Report/event user chủ động lưu, optional reminder.                        |
| `FeatureRollout`          | Trạng thái hiệu lực của một feature và config không nhạy cảm.             |
| `LocalReportImage`        | JPEG đã re-encode, giới hạn kích thước và có idempotency key riêng.       |

Payload từ Supabase vẫn phải được parse bằng Zod tại API boundary.

## Data model

| Bảng/view                | Quyền truy cập                                 | Vai trò                                                         |
| ------------------------ | ---------------------------------------------- | --------------------------------------------------------------- |
| `report_updates`         | Creator đọc update của mình; moderator đọc tất | Nguồn dữ liệu timeline, có idempotency key và publish state.    |
| `public_report_timeline` | Guest/member đọc                               | View đã bỏ identity, moderation metadata và nội dung chưa phát. |
| `report_status_history`  | Moderator đọc                                  | Trigger tự ghi khi hai trục status của report thay đổi.         |
| `notification_outbox`    | Server/service role                            | Queue retry-safe bằng `dedupe_key`; client không có grant.      |
| `user_saved_items`       | Member quản lý row của chính mình              | Nền tảng cho save event/report và reminder.                     |
| `feature_rollouts`       | Server-owned                                   | Tám feature engagement được seed với `enabled = false`.         |
| `report_media`           | Owner/moderator đọc metadata                   | Private upload lifecycle; media chưa duyệt không đi vào view.   |

`get_feature_rollouts()` là public RPC chỉ trả `feature_key`, effective `enabled` và config an
toàn. Audience được tính ở backend (`all`, `authenticated`, `plus`, `internal`). Flag chỉ điều khiển
trải nghiệm client; mọi write command vẫn phải kiểm tra authorization/RLS riêng.

## Feature rollout keys

```text
live_incident_timeline
photo_evidence_upload
followed_area_push_alerts
duplicate_report_merge
local_pulse_feed
event_save_reminder_share
official_data_layers
contributor_reputation
```

Mobile dùng `useFeatureRollout(key)`. Khi không có Supabase env hoặc RPC lỗi chưa được retry thành
công, placeholder của toàn bộ feature là `false`. Không có feature mới nào tự bật chỉ vì app được
update.

## Live incident timeline

`live_incident_timeline` đã có vertical slice hoàn chỉnh nhưng rollout vẫn mặc định tắt:

- Guest/member đọc tối đa 100 update đã publish qua `get_report_timeline()`.
- Chỉ người tạo report hoặc moderator nhận `can_update_report = true`; RPC không trả ownership ID.
- Update đi qua Edge Function `add-report-update` và RPC idempotent `add_report_update`.
- Member chỉ được chuyển `active → resolving/resolved`, `resolving → active/resolved` và
  `resolved → active`; moderator dùng cùng transition an toàn ở command này.
- Status change tự ghi `report_status_history`, enqueue outbox event và invalidate map/detail/timeline.
- Report `resolving` vẫn xuất hiện trong viewport, có thể được xác nhận và được auto-expire.

Để preview trên một Supabase environment, server operator có thể bật flag (không cần rebuild app):

```sql
update public.feature_rollouts
set enabled = true, audience = 'all'
where feature_key = 'live_incident_timeline';
```

Tắt lại bằng `enabled = false`. Việc bật flag không cấp quyền add update; RLS/RPC vẫn enforce actor.

Khi chạy demo mode không có Supabase env, có thể preview UI mà không đổi server:

```dotenv
EXPO_PUBLIC_DEMO_FEATURE_PREVIEW_KEYS=live_incident_timeline
```

Override này chỉ có hiệu lực khi `isDemoMode = true`; app đã cấu hình Supabase luôn dùng server rollout.

## Photo evidence upload

`photo_evidence_upload` đã có vertical slice upload ảnh nhưng rollout vẫn mặc định tắt:

- Member chọn tối đa ba ảnh từ màn tạo report; guest vẫn bị auth gate ở bước submit.
- Mobile chặn file nguồn trên 20 MB, resize tối đa 1.600 px, re-encode JPEG quality 0,82 và không
  chuyển tiếp EXIF/GPS của file nguồn.
- Mỗi ảnh tối đa 5 MB; client contract, Edge Function, RPC constraint và Storage bucket cùng enforce.
- RPC tạo reservation idempotent; signed token chỉ ghi đúng path trong bucket private.
- Retry nhận biết reservation/object đã tồn tại để tiếp tục completion mà không tạo row hoặc file mới.
- Completion kiểm tra object size/MIME rồi chuyển sang `uploaded` và enqueue moderation event.
- Admin Email OTP session phải có role moderator để nhận signed preview URL private.
- Approve claim row, copy canonical JPEG sang public bucket rồi service-role-only finalize URL; reject
  bắt buộc lý do. Publication lỗi trả claim về queue và xóa public object chưa finalize.
- Chỉ media có `moderation_status = 'approved'` mới xuất hiện trong public detail. Thumbnail variants,
  automated malware/content scan và video vẫn chưa triển khai.

Bật preview Supabase bằng server flag:

```sql
update public.feature_rollouts
set enabled = true, audience = 'authenticated'
where feature_key = 'photo_evidence_upload';
```

Hoặc preview UI trong demo mode:

```dotenv
EXPO_PUBLIC_DEMO_FEATURE_PREVIEW_KEYS=photo_evidence_upload
```

## Privacy và reliability

- `public_report_timeline` không chứa `created_by`, `trust_score_internal`, `hidden_at` hoặc raw GPS.
- `notification_outbox` không có grant cho `anon`/`authenticated`; `dedupe_key` chống enqueue lặp.
- Saved item yêu cầu đăng nhập và được RLS giới hạn theo `auth.uid()`.
- Status history lưu actor nội bộ để audit nhưng không được đưa vào public timeline.
- Subscription chỉ ảnh hưởng rollout audience; critical official safety data vẫn không bị paywall.
- Ảnh chờ duyệt nằm trong `report-evidence-private`; mobile không có service-role key và public view
  không trả private storage path.
