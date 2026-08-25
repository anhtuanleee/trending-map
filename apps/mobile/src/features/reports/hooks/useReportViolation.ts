import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReportViolationInput } from '@trending-map/contracts';

import { reportViolation } from '../api/report-violation';
import { reportQueryKeys } from '../model/report-query-keys';

export function useReportViolation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReportViolationInput) => reportViolation(input),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: reportQueryKeys.detail(variables.reportId) });
    },
  });
}
