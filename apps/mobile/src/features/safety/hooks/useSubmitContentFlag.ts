import { useMutation, useQueryClient } from '@tanstack/react-query';

import { publicReportCacheKey } from '@/lib/query/public-report-cache';

import { submitContentFlag } from '../api/submit-content-flag';

export function useSubmitContentFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitContentFlag,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: publicReportCacheKey }),
  });
}
