# Tài liệu Trending Map

Tài liệu này mô tả đúng trạng thái code tại ngày 25/08/2026. Mỗi capability được gắn một mức độ hoàn thiện để phân biệt phần đã chạy end-to-end với UI hoặc data foundation.

## Quy ước trạng thái

| Trạng thái     | Ý nghĩa                                                                      |
| -------------- | ---------------------------------------------------------------------------- |
| **Hoạt động**  | Có luồng UI/service/backend tương ứng và có thể chạy với cấu hình phù hợp.   |
| **Foundation** | Đã có một phần UI, schema hoặc service nhưng chưa hoàn thiện luồng sản phẩm. |
| **Planned**    | Chưa có trong code hiện tại; được giữ trong roadmap.                         |

## Mục lục

- [Sản phẩm và feature hiện tại](./product-and-features.md)
- [Tổng quan kiến trúc](./architecture/system-overview.md)
- [Kiến trúc mobile](./architecture/mobile.md)
- [Backend, dữ liệu và trust model](./architecture/backend-and-data.md)
- [Authentication và authorization](./authentication-and-authorization.md)
- [Subscription foundation](./subscriptions.md)
- [Engagement foundation](./engagement-foundation.md)
- [Mobile design system](./design-system.md)
- [API và shared contracts](./api-and-contracts.md)
- [Hướng dẫn phát triển](./development.md)
- [Roadmap](./roadmap.md)
- [Legal và content safety drafts](./legal/README.md)

## Nguyên tắc nguồn sự thật

- `packages/contracts` là nguồn sự thật cho payload và type dùng chung.
- `supabase/migrations` là nguồn sự thật cho schema, policy, RPC và quyền dữ liệu.
- `apps/mobile/app` chỉ giữ route; logic tái sử dụng nằm dưới `apps/mobile/src`.
- Tài liệu này phải được cập nhật trong cùng PR khi thay đổi feature, contract, policy hoặc kiến trúc.
