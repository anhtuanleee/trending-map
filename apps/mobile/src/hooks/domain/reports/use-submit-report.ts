import { useMutation, useQueryClient } from '@tanstack/react-query';

import { submitReport } from '@/features/reports/report.service';

import { reportQueryKeys } from './query-keys';

export function useSubmitReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitReport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reportQueryKeys.all }),
  });
}
