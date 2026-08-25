import { publicReportCacheKey } from '@/lib/query/public-report-cache';

export const reportQueryKeys = {
  all: publicReportCacheKey,
  details: [...publicReportCacheKey, 'detail'] as const,
  detail: (id: string) => [...reportQueryKeys.details, id] as const,
  timelines: [...publicReportCacheKey, 'timeline'] as const,
  timeline: (id: string) => [...reportQueryKeys.timelines, id] as const,
  updatePermissions: [...publicReportCacheKey, 'update-permission'] as const,
  updatePermission: (id: string, userId: string) =>
    [...reportQueryKeys.updatePermissions, id, userId] as const,
};
