import type { LocalReportImage } from '@trending-map/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { uploadReportEvidenceImage } from '../api/upload-report-evidence';
import { reportQueryKeys } from '../model/report-query-keys';

export function useUploadReportEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId, images }: { reportId: string; images: LocalReportImage[] }) => {
      const completed = [];
      for (const image of images) {
        completed.push(await uploadReportEvidenceImage(reportId, image));
      }
      return completed;
    },
    onSuccess: (_result, variables) =>
      queryClient.invalidateQueries({ queryKey: reportQueryKeys.detail(variables.reportId) }),
  });
}
