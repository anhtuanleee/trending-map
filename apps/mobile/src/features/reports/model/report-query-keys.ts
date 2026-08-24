import { publicReportCacheKey } from '@/lib/query/public-report-cache';

export const reportQueryKeys = {
  all: publicReportCacheKey,
  details: [...publicReportCacheKey, 'detail'] as const,
  detail: (id: string) => [...reportQueryKeys.details, id] as const,
};
