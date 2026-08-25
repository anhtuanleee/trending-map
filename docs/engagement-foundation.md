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

## Privacy và reliability

- `public_report_timeline` không chứa `created_by`, `trust_score_internal`, `hidden_at` hoặc raw GPS.
- `notification_outbox` không có grant cho `anon`/`authenticated`; `dedupe_key` chống enqueue lặp.
- Saved item yêu cầu đăng nhập và được RLS giới hạn theo `auth.uid()`.
- Status history lưu actor nội bộ để audit nhưng không được đưa vào public timeline.
- Subscription chỉ ảnh hưởng rollout audience; critical official safety data vẫn không bị paywall.
