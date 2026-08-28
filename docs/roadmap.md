# Roadmap

Roadmap ưu tiên hoàn thiện vertical slice đang có trước khi mở rộng feature. Thứ tự có thể đổi theo kết quả pilot và dữ liệu vận hành.

## P0 — hoàn thiện map/report core

- [x] Truyền camera bounds thật vào `get_map_items`; debounce và giữ previous data khi pan.
- Category filter đã nối query; còn search state và URL/deep-link params.
- [x] Chọn report coordinate bằng pin hoặc GPS; reverse geocoding address best-effort.
- Fetch categories từ backend, bỏ seed UUID hard-code khỏi form.
- Chuẩn hóa Edge Function validation/error codes bằng shared contract.
- Thêm loading retry, empty state và network/offline feedback.
- Test anonymous read, authenticated write, suspended user và privacy boundary.
- [x] Recent areas local tối đa tám record coarse; member sync để dành cho followed areas.

## P1 — trust và moderation

- [x] Engagement foundation: shared contracts, safe timeline view, saved items, server-only outbox
      và rollout flags mặc định tắt.
- [x] Admin email OTP + moderator role gate tại RPC/Edge boundary.
- [x] Moderation case queue; approve, reject, resolve, immutable action result và audit/history.
- [x] Tách moderation/visibility khỏi verification/operational; public RPC loại hidden/removed.
- [x] Structured provenance và content-flag taxonomy với authenticated idempotent command.
- [x] Safety notice ở map, preview, detail và composer.
- [x] Versioned policy foundation và policy drafts; còn legal review/hosting/acceptance UI.
- Appeal workflow, public correction history và reviewer independence.
- Legal request intake/verification và `legal_reviewer` role.
- Duplicate case detail, candidate comparison và merge command.
- Duplicate candidate query dựa trên category radius/window, sau đó thêm scoring.
- [x] Ghi `report_status_history` tự động khi verification/operational status đổi.
- [x] Live incident timeline: public read, owner update, lifecycle transition và rollout gate.
- [x] Photo evidence upload: sanitize JPEG, signed private upload, metadata, retry và pending moderation.
- [x] Photo publication: signed private preview, claim, moderator approve/reject và public URL.
- Thumbnail variants, malware/content scan tự động và retention cleanup cho private originals.
- Scheduled invocation cho `expire_stale_reports`.
- Rate limiting và abuse controls cho submit/confirmation/OTP.

## P2 — engagement

- Comment command/UI cùng hide/moderation policy.
- Vẽ và lưu followed areas.
- Đăng ký Expo push token; notification fan-out theo polygon/category/severity.
- Official source ingestion và verified operator workflow.
- Realtime refresh có giới hạn để tránh subscription fan-out quá lớn.

## P2.5 — subscription rollout

- [x] Free/Plus contract, plan limits và feature catalog.
- [x] Env flags cho foundation, paywall, billing, founder offer và per-feature rollout.
- [x] Read-own entitlement table/RLS, account entry và paywall preview shell.
- Hoàn thiện followed areas, custom alert và push fan-out trước khi mở bán.
- Tạo products trên App Store/Google Play và nối RevenueCat billing gateway.
- Tạo verified webhook upsert entitlement; test refund/cancel/restore/grace period.
- Thêm localized price, terms/privacy, manage subscription và conversion analytics.

## P3 — reliability và scale

- E2E tests cho guest browse, OTP/Google OAuth return intent, submit và confirm.
- Observability: structured logs, error tracking, RPC latency và map query metrics.
- Offline read cache và queued contribution với conflict/idempotency handling.
- Server-side clustering hoặc tile strategy khi density vượt giới hạn 1.000 rows/viewport.
- Data retention, deletion/export workflow và privacy review cho location data.

## Success metrics đề xuất

| Mục tiêu          | Metric                                                      |
| ----------------- | ----------------------------------------------------------- |
| Discovery hữu ích | Tỷ lệ session mở ít nhất một report detail                  |
| Freshness         | P50/P95 từ `starts_at` tới lần xác nhận đầu tiên            |
| Trust             | Tỷ lệ report đạt community/official verification            |
| Safety            | Tỷ lệ report disputed/rejected và thời gian moderator xử lý |
| Performance       | P95 map query latency và time-to-first-map-item             |
| Contribution      | Submit completion rate sau auth gate                        |

Không thu thập analytics chứa raw email, access token hoặc exact historical location ngoài mục đích sản phẩm đã công bố.
