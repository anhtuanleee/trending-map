import type { ConfirmationInput } from '@trending-map/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';

import { confirmReport, getReportById } from '../api/report.service';
import { reportQueryKeys } from '../model/report-query-keys';

export function useReport(id: string) {
  return useQuery({
    queryKey: reportQueryKeys.detail(id),
    queryFn: () => getReportById(id),
    enabled: Boolean(id),
  });
}

export function useConfirmReport(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (kind: ConfirmationInput['kind']) =>
      confirmReport({ reportId: id, kind, idempotencyKey: Crypto.randomUUID() }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: reportQueryKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: reportQueryKeys.all });
    },
  });
}
