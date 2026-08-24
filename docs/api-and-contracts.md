# API và shared contracts

## Contract ownership

`packages/contracts` export Zod schemas và inferred TypeScript types. Client phải dùng contract này ở form/service boundary. SQL types và constraints phải được giữ tương thích qua migration và contract tests.

## Domain enums

| Domain       | Values                                                              |
| ------------ | ------------------------------------------------------------------- |
| Report type  | `incident`, `scheduled_event`, `area_alert`                         |
| Severity     | `info`, `low`, `medium`, `high`, `critical`                         |
| Verification | `unverified`, `community_verified`, `official_verified`, `disputed` |
| Operational  | `active`, `monitoring`, `resolved`, `expired`, `rejected`           |
| Confirmation | `seen`, `not_there`, `incorrect`                                    |
| App role     | `member`, `trusted`, `official`, `moderator`                        |

## Public reads

### `get_map_items` RPC

Input:

| Param                                     | Type             | Ghi chú                            |
| ----------------------------------------- | ---------------- | ---------------------------------- |
| `p_west`, `p_south`, `p_east`, `p_north`  | number           | WGS84 viewport/radius bounding box |
| `p_category_slugs`                        | `text[]`         | Mảng rỗng nghĩa là tất cả category |
| `p_center_longitude`, `p_center_latitude` | number, nullable | Tâm dùng để tính khoảng cách       |
| `p_radius_meters`                         | number, nullable | Giới hạn vòng tròn cho nearby list |

Output tối thiểu gồm ID, type/category, title, centroid coordinate, severity,
verification/operational status, start/expiry, confirmation count và `distance_meters`. Query chỉ trả
active/monitoring, chưa hết hạn, nằm trong bounds và bán kính nếu được truyền; giới hạn 1.000 rows.
Thứ tự ưu tiên là severity, khoảng cách, độ mới rồi verification status.

### `public_report_details` view

Trả description, address, source label và approved media thumbnails bên cạnh map fields. Không trả `created_by`, `anonymous_publicly`, `trust_score_internal` hoặc user profile.

## Authenticated commands

### `POST /functions/v1/submit-report`

Body theo `SubmitReportInput`:

```json
{
  "type": "incident",
  "categoryId": "24beceab-c7c1-407d-a0ab-b32ac358e4ec",
  "title": "Ngập sâu trên đường Nguyễn Huệ",
  "description": "Nước lên cao, xe máy nên tránh đoạn này.",
  "severity": "high",
  "coordinate": { "latitude": 10.7731, "longitude": 106.7034 },
  "addressLabel": "Nguyễn Huệ, Quận 1",
  "startsAt": "2026-08-24T10:00:00.000Z",
  "anonymousPublicly": true,
  "idempotencyKey": "a4ef091f-ffca-45a7-92f9-7db4e8fe12e0"
}
```

Success: HTTP 201, `{ "id": "...", "status": "unverified" }`.

### `POST /functions/v1/confirm-report`

Body theo `ConfirmationInput`: `reportId`, `kind`, optional coordinate và `idempotencyKey`. Success trả `{ "reportId": "...", "accepted": true }`.

Cả hai endpoint yêu cầu Authorization header. Edge Function dùng anon key cùng caller JWT, không dùng service role cho community commands.

## Validation và idempotency

- Title: 6–120 ký tự; description: 12–1200.
- Scheduled event bắt buộc `endsAt`.
- Latitude/longitude nằm trong WGS84 range.
- Client tạo UUID idempotency cho mỗi intent mới.
- Retry cùng submit key của cùng user trả report cũ.
- Confirmation update vote hiện tại theo user/report thay vì tạo nhiều vote.

## Error contract hiện tại

Edge Functions dùng JSON `{ "error": "code_or_message" }` với các status phổ biến: 400 invalid JSON/RPC error, 401 thiếu auth, 405 sai method, 422 payload không hợp lệ. Error taxonomy chưa được chuẩn hóa; client hiện hiển thị message tổng quát.

## Contract change checklist

1. Sửa Zod schema/type.
2. Tạo migration tương thích.
3. Sửa Edge Function/RPC adapter.
4. Sửa demo fixtures.
5. Thêm/đổi contract tests.
6. Cập nhật file này và feature matrix.
