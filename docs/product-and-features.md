# Sản phẩm và feature hiện tại

## Tầm nhìn

Trending Map là bản đồ cộng đồng theo thời gian gần thực, giúp người dùng thấy sự kiện và tình trạng đang xảy ra quanh mình: ngập nước, ổ gà, cây đổ, cảnh báo thời tiết, ca nhạc và các sự kiện có lịch.

Nguyên tắc sản phẩm cốt lõi:

1. **Guest-first:** không cần đăng nhập để xem thông tin công khai.
2. **Đăng nhập khi đóng góp:** tạo báo cáo và xác nhận yêu cầu tài khoản.
3. **Không đồng nhất “anonymous” với “không có danh tính”:** người đăng có thể ẩn tên công khai, nhưng backend vẫn giữ `created_by` để chống spam và điều tra abuse.
4. **Thông tin có vòng đời:** báo cáo có trạng thái vận hành, thời hạn hết hiệu lực và mức xác minh riêng.
5. **Trust có thể giải thích:** số xác nhận và phản đối dẫn đến trạng thái rõ ràng; nguồn chính thức được bảo toàn.

## Ma trận feature

| Khu vực       | Capability                     | Trạng thái     | Ghi chú hiện tại                                                                      |
| ------------- | ------------------------------ | -------------- | ------------------------------------------------------------------------------------- |
| Mobile map    | Xem map khi chưa đăng nhập     | **Hoạt động**  | Dùng demo data khi thiếu Supabase env.                                                |
| Mobile map    | Hiển thị marker và cluster     | **Hoạt động**  | MapLibre `GeoJSONSource`; marker đổi màu theo severity.                               |
| Mobile map    | Tracking vị trí hiện tại       | **Hoạt động**  | Foreground-only, last-known → current high accuracy → live tracking và camera follow. |
| Mobile map    | Báo cáo trong viewport         | **Hoạt động**  | Camera bounds được debounce rồi truyền vào RPC; demo data cũng lọc theo cùng vùng.    |
| Mobile map    | Nearby reports                 | **Hoạt động**  | List 1/5/15 km, distance backend và chuyển mode GPS/camera khi pan.                   |
| Mobile map    | Khu vực gần đây                | **Hoạt động**  | Tối đa 8 center/zoom coarse local, hỗ trợ pin và không ghi GPS history.               |
| Mobile map    | Preview và mở chi tiết report  | **Hoạt động**  | Chọn marker để xem card, sau đó mở route chi tiết.                                    |
| Mobile map    | Search, category filter        | **Foundation** | Category filter đã hoạt động; search/deep-link params chưa nối.                       |
| Mobile map    | Query theo viewport thật       | **Hoạt động**  | Query key gồm bounds, zoom, filter, center và giữ dữ liệu cũ khi pan/refetch.         |
| Auth          | Đăng nhập OTP qua email        | **Hoạt động**  | Supabase Email OTP, resend 60 giây và demo mode chấp nhận mã sáu chữ số.              |
| Auth          | Đăng nhập Google OAuth         | **Hoạt động**  | Browser OAuth, custom deep-link callback, session persistence và demo fallback.       |
| Auth          | Auth gate có return URL        | **Hoạt động**  | Guest được chuyển tới auth khi tạo/xác nhận report, kể cả từ trang detail.            |
| Auth          | Tài khoản và đăng xuất         | **Hoạt động**  | Có account route, trạng thái guest/member, xác nhận logout và xóa query cache.        |
| Reporting     | Tạo report                     | **Hoạt động**  | Form + Zod + Edge Function + RPC; cần Supabase để lưu thật.                           |
| Reporting     | Chọn vị trí report             | **Hoạt động**  | GPS-first, manual khi denied, accuracy guard 100 m và reverse geocode best-effort.    |
| Reporting     | Ẩn tên công khai               | **Hoạt động**  | Public view/RPC không trả reporter identity; backend vẫn giữ user ID.                 |
| Reporting     | Upload ảnh hiện trường         | **Hoạt động**  | Tối đa 3 JPEG private, sanitize + signed upload + retry; rollout mặc định tắt.        |
| Reporting     | Duyệt/publish ảnh và video     | **Foundation** | Approved-only public view có sẵn; thumbnail worker, moderation command/video chưa có. |
| Trust         | “Tôi cũng thấy” / “Không còn”  | **Hoạt động**  | Authenticated command, một confirmation/user/report, có idempotency.                  |
| Trust         | Community verification         | **Hoạt động**  | Ba `seen` chuyển sang `community_verified`; phản đối đủ ngưỡng thành `disputed`.      |
| Trust         | Official verification          | **Foundation** | Có source model và status; chưa có ingestion/official operator workflow.              |
| Comments      | Bình luận report               | **Foundation** | Có schema; chưa có policy command và UI.                                              |
| Follow        | Theo dõi khu vực               | **Foundation** | Có polygon PostGIS + RLS; chưa có UI và notification worker.                          |
| Notifications | Push notification              | **Foundation** | Có `push_devices`; chưa có đăng ký token end-to-end và fan-out.                       |
| Engagement    | Live incident timeline         | **Hoạt động**  | Guest read + owner command + lifecycle UI; rollout mặc định tắt.                      |
| Engagement    | Save report/event và reminder  | **Foundation** | Có user-owned schema/RLS; chưa có action/UI/scheduler.                                |
| Operations    | Notification outbox            | **Foundation** | Server-only queue có dedupe/retry fields; chưa có worker.                             |
| Operations    | Feature rollout                | **Hoạt động**  | RPC + mobile hook; tám feature mới mặc định tắt.                                      |
| Subscription  | Plan/entitlement/feature flags | **Foundation** | Free/Plus contract, RLS read-own, preview UI và billing adapter mặc định tắt.         |
| Subscription  | Purchase/restore/store webhook | **Planned**    | Chưa cài billing SDK, chưa tạo store products và chưa có verified webhook.            |
| Admin         | Danh sách moderation           | **Hoạt động**  | Next dashboard đọc Supabase bằng service role hoặc demo rows.                         |
| Admin         | Filter/approve/reject/merge    | **Foundation** | UI shell đã có; button/filter chưa thực thi command.                                  |
| Admin         | Duplicate risk                 | **Foundation** | Có category radius/window và cột demo; chưa có scoring engine.                        |
| Operations    | Auto-expire report             | **Foundation** | Có RPC và status-history trigger; chưa có scheduled job trong repo.                   |

## Luồng người dùng chính

### Guest khám phá

1. Mở app và thấy bản đồ ngay.
2. App tải report từ demo data hoặc `get_map_items`.
3. Người dùng chọn marker, xem preview và mở chi tiết.
4. Khi bấm báo cáo/xác nhận, auth gate mới yêu cầu đăng nhập.

### Thành viên gửi report

1. Auth gate lưu đường dẫn cần quay lại.
2. Người dùng chọn Google OAuth hoặc nhận OTP qua email để đăng nhập không cần mật khẩu.
3. Người dùng kéo pin hoặc dùng GPS, sau đó xác nhận tọa độ và nhãn địa chỉ.
4. Form kiểm tra payload bằng shared Zod schema; submit vẫn auth-gated với deep link trực tiếp.
5. Edge Function giữ JWT của người dùng và gọi RPC `submit_report`.
6. RPC kiểm tra suspension, category, coordinate, idempotency; sau đó tạo report ở trạng thái `unverified`.
7. Nếu rollout ảnh bật, app upload tuần tự các JPEG đã re-encode vào bucket private và giữ màn hình
   để retry nếu một ảnh lỗi.

### Cộng đồng xác nhận

1. Thành viên chọn `seen` hoặc `not_there` từ trang chi tiết.
2. Edge Function gọi `confirm_report` bằng JWT người dùng.
3. Confirmation được upsert theo `(report_id, user_id)`.
4. Backend tính lại count và verification status.

## Ngoài phạm vi bản hiện tại

Chưa nên mô tả là đã hoàn thiện: billing subscription, tìm kiếm địa điểm, filter thật, realtime
refresh, media moderation/publication, video upload, comment, notification fan-out, duplicate detection, moderation actions,
official-source ingestion, offline mode, analytics và E2E tests. Các phần này nằm trong
[roadmap](./roadmap.md).
