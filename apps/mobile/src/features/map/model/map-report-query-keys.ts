import { publicReportCacheKey } from '@/lib/query/public-report-cache';

export const mapReportQueryKeys = {
  all: [...publicReportCacheKey, 'map'] as const,
  viewport: (scope: string) => [...mapReportQueryKeys.all, 'viewport', scope] as const,
  nearby: (scope: string) => [...mapReportQueryKeys.all, 'nearby', scope] as const,
};
