export type ReportCategoryGroup = 'infrastructure_disaster' | 'public_event';

export type ReportCategoryItem = {
  id: string;
  slug: string;
  label: string;
  group: ReportCategoryGroup;
  type: 'incident' | 'scheduled_event' | 'area_alert';
  description: string;
  iconName:
    | 'Droplets'
    | 'Construction'
    | 'Trees'
    | 'Zap'
    | 'Car'
    | 'Music2'
    | 'Calendar'
    | 'Trophy'
    | 'Users';
};

export const reportCategoryGroups: Record<
  ReportCategoryGroup,
  { label: string; description: string; priorityLabel: string }
> = {
  infrastructure_disaster: {
    label: 'Hạ tầng & Thiên tai',
    description: 'Ngập lụt, mưa bão, cây đổ, cống tắc, sự cố đường sá (Ưu tiên cao)',
    priorityLabel: 'ƯU TIÊN CAO',
  },
  public_event: {
    label: 'Sự kiện công cộng',
    description: 'Lễ hội, hội chợ, giải chạy, mật độ giao thông quanh sự kiện',
    priorityLabel: 'THÔNG TIN KHÁCH QUAN',
  },
};

export const reportCategories: readonly ReportCategoryItem[] = [
  // ── Group A: Hạ tầng & Thiên tai (Ưu tiên cao - rủi ro thấp nhất) ──
  {
    id: '24beceab-c7c1-407d-a0ab-b32ac358e4ec',
    slug: 'flood',
    label: 'Ngập nước',
    group: 'infrastructure_disaster',
    type: 'incident',
    description: 'Điểm ngập nước thực tế, mực nước trên đường',
    iconName: 'Droplets',
  },
  {
    id: '70f09943-78ac-4403-9225-4cc4be183493',
    slug: 'pothole',
    label: 'Hư hỏng mặt đường',
    group: 'infrastructure_disaster',
    type: 'incident',
    description: 'Hố ga, cống tắc, đường sụt lún, nứt, ổ gà lớn',
    iconName: 'Construction',
  },
  {
    id: 'e1086e24-4f24-4b53-9092-d961e6878b21',
    slug: 'fallen_tree',
    label: 'Cây đổ / Cột điện',
    group: 'infrastructure_disaster',
    type: 'incident',
    description: 'Cây ngã đổ, cành gãy, cột điện nghiêng, dây diện đứt',
    iconName: 'Trees',
  },
  {
    id: '6a36903a-19e9-4355-80df-5f85d6910164',
    slug: 'storm',
    label: 'Mưa bão / Sự cố',
    group: 'infrastructure_disaster',
    type: 'area_alert',
    description: 'Mưa to gió lốc, ngập diện rộng, mất điện khu vực',
    iconName: 'Zap',
  },
  {
    id: 'a9b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d',
    slug: 'traffic_block',
    label: 'Tắc đường do ngập',
    group: 'infrastructure_disaster',
    type: 'incident',
    description: 'Ùn tắc giao thông do đường ngập, cây đổ hoặc sụt lún',
    iconName: 'Car',
  },

  // ── Group B: Sự kiện công cộng (Mở rộng - chỉ thông tin khách quan) ──
  {
    id: '58124383-1393-4079-b125-bdbac0b5c781',
    slug: 'music',
    label: 'Sự kiện âm nhạc',
    group: 'public_event',
    type: 'scheduled_event',
    description: 'Lịch trình công khai, tình trạng giao thông quanh sân khấu',
    iconName: 'Music2',
  },
  {
    id: 'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e',
    slug: 'festival',
    label: 'Lễ hội / Hội chợ',
    group: 'public_event',
    type: 'scheduled_event',
    description: 'Hội chợ ẩm thực, lễ hội địa phương, mật độ người',
    iconName: 'Calendar',
  },
  {
    id: 'c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f',
    slug: 'sports',
    label: 'Sự kiện thể thao',
    group: 'public_event',
    type: 'scheduled_event',
    description: 'Trận bóng đá, giải chạy, tình trạng giao thông quanh khán đài',
    iconName: 'Trophy',
  },
  {
    id: 'd3e4f5a6-b7c8-4d9e-0f1a-2b3c4d5e6f7a',
    slug: 'public_place',
    label: 'Địa điểm đông đúc',
    group: 'public_event',
    type: 'incident',
    description: 'Công viên, phố đi bộ, quảng trường đang tập trung đông người',
    iconName: 'Users',
  },
] as const;

export const reportLocationConfig = {
  minimumAcceptedGpsAccuracyMeters: 100,
} as const;

/**
 * Disclaimer pháp lý bắt buộc hiển thị trên toàn bộ bài đăng và biểu mẫu
 */
export const LEGAL_DISCLAIMER =
  'Thông tin do cộng đồng đóng góp, chưa phải thông tin chính thức. App không chịu trách nhiệm về độ chính xác.';

/**
 * Quy định an toàn và nguyên tắc đăng bài
 */
export const SAFETY_GUIDELINES = [
  'Chỉ cho phép báo cáo thực tế quan sát được (kèm ảnh hiện trường + vị trí GPS).',
  'Tuyệt đối KHÔNG đăng thông tin về số người chết, mất tích, bị thương (thương vong).',
  'Tuyệt đối KHÔNG suy đoán, dự báo thiên tai hoặc tung tin đồn giật gân (vỡ đê, sập cầu...).',
  'Không bình luận về đời tư, scandal, xúc phạm hoặc chụp lén cận mặt cá nhân/nghệ sĩ.',
  'Mọi báo cáo được lưu log (thời gian, tài khoản, vị trí) để phục vụ kiểm duyệt và cơ quan chức năng khi cần.',
] as const;

/**
 * Danh sách từ khóa nhạy cảm / vi phạm pháp luật cần cảnh báo hoặc chặn tự động
 */
export const PROHIBITED_KEYWORD_PATTERNS = [
  {
    pattern: /(chết|tử vong|thi thể|xác chết|mất tích|nạn nhân chết)/i,
    message: 'Không được đăng tải thông tin về thương vong / số người chết hoặc mất tích.',
  },
  {
    pattern: /(vỡ đê|vỡ đập|sập cầu|sóng thần|động đất lớn|thảm họa)/i,
    message: 'Không được đăng tin đồn mang tính hoang mang, chưa có xác thực chính thức.',
  },
  {
    pattern: /(scandal|bóc phốt|lộ clip|lừa đảo|bắt cóc)/i,
    message: 'Không đăng nội dung công kích cá nhân, đời tư nghệ sĩ hoặc tin đồn chưa kiểm chứng.',
  },
] as const;

/**
 * Kiểm tra nội dung trước khi gửi để đảm bảo tuân thủ nguyên tắc an toàn
 */
export function validateSafeReportContent(
  title: string,
  description: string,
): { safe: boolean; warning?: string } {
  const combined = `${title} ${description}`.trim();
  for (const { pattern, message } of PROHIBITED_KEYWORD_PATTERNS) {
    if (pattern.test(combined)) {
      return { safe: false, warning: message };
    }
  }
  return { safe: true };
}
