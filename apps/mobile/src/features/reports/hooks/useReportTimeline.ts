import type { AddReportUpdateInput } from '@trending-map/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';

import { useAuth } from '@/features/auth';

import { addReportUpdate } from '../api/add-report-update';
import { canUpdateReport } from '../api/can-update-report';
import { getReportTimeline } from '../api/get-report-timeline';
import { reportQueryKeys } from '../model/report-query-keys';

export function useReportTimeline(reportId: string, enabled = true) {
  return useQuery({
    queryKey: reportQueryKeys.timeline(reportId),
    queryFn: () => getReportTimeline(reportId),
    enabled: enabled && Boolean(reportId),
  });
}

export function useCanUpdateReport(reportId: string, enabled = true) {
  const { user } = useAuth();

  return useQuery({
    queryKey: reportQueryKeys.updatePermission(reportId, user?.id ?? 'guest'),
    queryFn: () => canUpdateReport(reportId),
    enabled: enabled && Boolean(reportId) && Boolean(user),
    placeholderData: { canUpdate: false },
    staleTime: 60_000,
  });
}

export function useAddReportUpdate(reportId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<AddReportUpdateInput, 'reportId' | 'idempotencyKey'>) =>
      addReportUpdate({ ...input, reportId, idempotencyKey: Crypto.randomUUID() }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: reportQueryKeys.timeline(reportId) }),
        queryClient.invalidateQueries({ queryKey: reportQueryKeys.detail(reportId) }),
        queryClient.invalidateQueries({ queryKey: reportQueryKeys.all }),
      ]);
    },
  });
}
