import type { ContentFlagReason } from '@trending-map/contracts';

export const contentFlagOptions: Array<{
  value: ContentFlagReason;
  label: string;
  description: string;
}> = [
  {
    value: 'false_information',
    label: 'Thông tin sai',
    description: 'Nội dung sai hoặc có khả năng gây hiểu nhầm.',
  },
  {
    value: 'incorrect_location',
    label: 'Sai vị trí',
    description: 'Marker không đúng địa điểm xảy ra sự việc.',
  },
  {
    value: 'outdated',
    label: 'Đã hết hiệu lực',
    description: 'Sự việc không còn xảy ra hoặc thông tin đã cũ.',
  },
  {
    value: 'privacy_violation',
    label: 'Xâm phạm riêng tư',
    description: 'Có dữ liệu cá nhân, khuôn mặt, biển số hoặc địa chỉ nhạy cảm.',
  },
  {
    value: 'defamation',
    label: 'Vu khống hoặc xúc phạm',
    description: 'Cáo buộc hoặc công kích cá nhân, tổ chức không có căn cứ.',
  },
  {
    value: 'fake_official_source',
    label: 'Giả mạo nguồn chính thức',
    description: 'Nội dung tự nhận là thông báo chính thức nhưng không đáng tin.',
  },
  {
    value: 'dangerous_content',
    label: 'Nội dung nguy hiểm',
    description: 'Có thể kích động, gây hoảng loạn hoặc dẫn đến hành vi nguy hiểm.',
  },
  { value: 'spam', label: 'Spam hoặc quảng cáo', description: 'Nội dung lặp lại hoặc quảng cáo.' },
  {
    value: 'copyright',
    label: 'Vi phạm bản quyền',
    description: 'Hình ảnh hoặc nội dung được sử dụng không có quyền.',
  },
  { value: 'other', label: 'Lý do khác', description: 'Một vấn đề chưa có trong danh sách.' },
];
