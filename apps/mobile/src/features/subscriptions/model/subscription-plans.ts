import type { SubscriptionFeatureKey, SubscriptionTier } from '@trending-map/contracts';

export type SubscriptionPlanLimits = {
  followedAreas: number;
  customAlerts: boolean;
  customAlertRadius: boolean;
  quietHours: boolean;
  routeWatches: number;
  reportHistoryDays: number;
  savedFilters: number;
  digests: boolean;
  adFree: boolean;
};

export type SubscriptionFeatureDefinition = {
  key: SubscriptionFeatureKey;
  title: string;
  description: string;
  freeLabel: string;
  plusLabel: string;
  phase: 'launch' | 'next' | 'later';
};

type SubscriptionPlanDefinition = {
  tier: SubscriptionTier;
  name: string;
  limits: SubscriptionPlanLimits;
};

type PlusSubscriptionPlanDefinition = SubscriptionPlanDefinition & {
  fallbackPrices: { monthly: string; yearly: string; founderYearly: string };
  productIds: { monthly: string; yearly: string; founderYearly: string };
};

export const subscriptionPlans = {
  free: {
    tier: 'free',
    name: 'Trending Map Free',
    limits: {
      followedAreas: 1,
      customAlerts: false,
      customAlertRadius: false,
      quietHours: false,
      routeWatches: 0,
      reportHistoryDays: 7,
      savedFilters: 0,
      digests: false,
      adFree: false,
    },
  },
  plus: {
    tier: 'plus',
    name: 'Trending Map Plus',
    fallbackPrices: { monthly: '29.000đ', yearly: '249.000đ', founderYearly: '199.000đ' },
    productIds: {
      monthly: 'trending_map_plus_monthly',
      yearly: 'trending_map_plus_yearly',
      founderYearly: 'trending_map_plus_founder_yearly',
    },
    limits: {
      followedAreas: 10,
      customAlerts: true,
      customAlertRadius: true,
      quietHours: true,
      routeWatches: 3,
      reportHistoryDays: 90,
      savedFilters: 10,
      digests: true,
      adFree: true,
    },
  },
} as const satisfies {
  free: SubscriptionPlanDefinition;
  plus: PlusSubscriptionPlanDefinition;
};

export const subscriptionFeatureCatalog: SubscriptionFeatureDefinition[] = [
  {
    key: 'followed_areas',
    title: 'Khu vực theo dõi',
    description:
      'Theo dõi quanh nhà, công ty hoặc địa điểm thường đến mà không lưu lịch sử di chuyển.',
    freeLabel: '1 khu vực',
    plusLabel: 'Tối đa 10 khu vực',
    phase: 'launch',
  },
  {
    key: 'custom_alerts',
    title: 'Cảnh báo tùy chỉnh',
    description: 'Chọn category, severity và trạng thái xác minh cho từng khu vực.',
    freeLabel: 'Cảnh báo an toàn cơ bản',
    plusLabel: 'Bộ lọc cảnh báo riêng',
    phase: 'launch',
  },
  {
    key: 'alert_radius',
    title: 'Bán kính cảnh báo',
    description: 'Điều chỉnh phạm vi nhận cảnh báo thay vì dùng bán kính mặc định.',
    freeLabel: 'Bán kính mặc định',
    plusLabel: 'Tùy chỉnh bán kính',
    phase: 'launch',
  },
  {
    key: 'quiet_hours',
    title: 'Khung giờ yên lặng',
    description:
      'Tắt thông báo thường trong giờ nghỉ; cảnh báo critical chính thức vẫn được ưu tiên.',
    freeLabel: 'Không tùy chỉnh',
    plusLabel: 'Lịch riêng theo ngày',
    phase: 'next',
  },
  {
    key: 'route_watch',
    title: 'Theo dõi tuyến đường',
    description: 'Nhận cảnh báo khi tuyến thường đi có ngập, ổ gà hoặc sự cố nghiêm trọng.',
    freeLabel: 'Không bao gồm',
    plusLabel: 'Tối đa 3 tuyến',
    phase: 'later',
  },
  {
    key: 'report_history',
    title: 'Lịch sử khu vực',
    description: 'Xem lại report công khai theo khu vực mà không lưu GPS history cá nhân.',
    freeLabel: '7 ngày',
    plusLabel: '90 ngày',
    phase: 'next',
  },
  {
    key: 'saved_filters',
    title: 'Bộ lọc đã lưu',
    description: 'Lưu tổ hợp category, severity, thời gian và verification để dùng lại.',
    freeLabel: 'Không bao gồm',
    plusLabel: 'Tối đa 10 bộ lọc',
    phase: 'next',
  },
  {
    key: 'digests',
    title: 'Bản tin tổng hợp',
    description: 'Nhận tổng hợp hàng ngày hoặc hàng tuần thay vì từng thông báo riêng lẻ.',
    freeLabel: 'Không bao gồm',
    plusLabel: 'Hàng ngày hoặc hàng tuần',
    phase: 'later',
  },
  {
    key: 'ad_free',
    title: 'Không quảng cáo',
    description: 'Loại bỏ placement thương mại; sponsored event vẫn phải được gắn nhãn rõ ràng.',
    freeLabel: 'Có thể có quảng cáo sau này',
    plusLabel: 'Không quảng cáo',
    phase: 'later',
  },
];
