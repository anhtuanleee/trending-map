# Chính sách kiểm duyệt nội dung — BẢN NHÁP

## Mục tiêu

Giảm tác hại nhưng vẫn giữ đặc tính realtime. Báo cáo rủi ro thông thường có thể xuất hiện ngay với
nhãn `unverified`; nội dung rủi ro cao được ưu tiên kiểm tra hoặc giới hạn.

## Trạng thái độc lập

- `verification_status`: mức độ tin cậy.
- `operational_status`: vòng đời sự việc.
- `moderation_status`: tiến trình kiểm duyệt.
- `visibility_status`: khả năng hiển thị công khai.

Không dùng một trục để suy diễn trục khác. Community confirmation không thể tạo
`official_verified`.

## Mức ưu tiên

| Mức | Ví dụ                                           | Xử lý ban đầu                  |
| --- | ----------------------------------------------- | ------------------------------ |
| 5   | riêng tư, vu khống, giả mạo official, nguy hiểm | ưu tiên cao, reviewer xem ngay |
| 4   | thông tin sai, bản quyền                        | fact-check/review              |
| 3   | sai tọa độ                                      | kiểm tra vị trí và nguồn       |
| 2   | outdated, spam                                  | queue thông thường             |
| 1   | lý do khác                                      | triage                         |

Một user flag không tự ẩn nội dung. Hệ thống chỉ gắn nhãn/tăng ưu tiên; moderator quyết định giới
hạn hoặc gỡ để tránh mass-report abuse. Automated classifier chỉ được flag, không được tự xác minh.

## Quyết định và audit

Mọi quyết định ẩn/gỡ phải có reason code, private note khi cần, public explanation phù hợp, actor,
timestamp và policy version. Không xóa cứng report; giữ evidence nội bộ theo retention/legal hold.

## Khiếu nại và đính chính

Người tạo hoặc chủ thể bị ảnh hưởng có thể khiếu nại. Reviewer khiếu nại nên khác reviewer ban đầu.
Chỉnh sửa dữ kiện quan trọng phải tạo revision công khai thay vì âm thầm ghi đè.
