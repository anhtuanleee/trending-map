# Chính sách quyền riêng tư — BẢN NHÁP

Trạng thái: cần legal review và data-flow audit trước khi publish.

## Dữ liệu được xử lý

- Thông tin tài khoản và phiên đăng nhập.
- Báo cáo, xác nhận và khiếu nại do người dùng chủ động gửi.
- Tọa độ report hoặc confirmation khi người dùng chủ động cho phép.
- Ảnh hiện trường đã được xử lý loại metadata vị trí trước khi upload.
- Log bảo mật, chống spam, audit kiểm duyệt và thông tin thiết bị cần thiết để vận hành.

## Mục đích

Dữ liệu được dùng để hiển thị báo cáo theo khu vực, kiểm chứng tín hiệu cộng đồng, chống lạm dụng,
gửi thông báo đã chọn, xử lý khiếu nại và tuân thủ nghĩa vụ pháp lý.

## Vị trí

App chỉ yêu cầu quyền foreground. Recent areas được làm thô và lưu cục bộ. Không được lưu lịch sử GPS
chi tiết hoặc dùng vị trí cho quảng cáo. Tọa độ confirmation phải được tối thiểu hóa hoặc xóa sau khi
tính tín hiệu proximity theo retention policy được phê duyệt.

## Công khai và chia sẻ

Public payload không chứa `created_by`, danh tính người báo cáo, trust score nội bộ, private
moderation note hoặc tài liệu yêu cầu pháp lý. Dữ liệu chỉ được chia sẻ với nhà cung cấp hạ tầng và
cơ quan có thẩm quyền theo căn cứ, phạm vi và quy trình đã xác minh.

## Lưu trữ

Phải bổ sung bảng retention cụ thể cho tài khoản, ảnh private, confirmation location, audit, appeal
và legal request trước khi publish. Không xóa evidence đang nằm trong legal hold.

## Quyền của người dùng

Người dùng phải có kênh yêu cầu truy cập, sửa, xóa hoặc hạn chế xử lý dữ liệu phù hợp; được thông báo
khi policy thay đổi đáng kể; và có quyền khiếu nại quyết định kiểm duyệt liên quan đến mình.

## Bảo mật và liên hệ

Phải bổ sung pháp nhân kiểm soát dữ liệu, địa chỉ, email privacy, đơn vị xử lý dữ liệu, nơi lưu trữ và
quy trình sự cố trước khi publish.
