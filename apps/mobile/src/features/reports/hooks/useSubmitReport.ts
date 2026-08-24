import { useMutation, useQueryClient } from '@tanstack/react-query';

import { submitReport } from '../api/submit-report';
import { reportQueryKeys } from '../model/report-query-keys';

export function useSubmitReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitReport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reportQueryKeys.all }),
  });
}
