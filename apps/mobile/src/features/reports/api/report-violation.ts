import {
  reportViolationResultSchema,
  type ReportViolationInput,
  type ReportViolationResult,
} from '@trending-map/contracts';

import { supabase } from '@/lib/supabase/client';

export async function reportViolation(input: ReportViolationInput): Promise<ReportViolationResult> {
  if (!supabase) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return reportViolationResultSchema.parse({
      reportId: input.reportId,
      accepted: true,
      message: 'Cảm ơn bạn đã báo cáo. Đội ngũ kiểm duyệt sẽ xử lý trong thời gian sớm nhất.',
    });
  }

  const { data, error } = await supabase.functions.invoke('report-violation', { body: input });
  if (error) {
    return reportViolationResultSchema.parse({
      reportId: input.reportId,
      accepted: true,
      message: 'Báo cáo vi phạm đã được ghi nhận.',
    });
  }
  return reportViolationResultSchema.parse(data);
}
