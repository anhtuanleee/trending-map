import {
  submitReportResultSchema,
  type SubmitReportInput,
  type SubmitReportResult,
} from '@trending-map/contracts';

import { supabase } from '@/lib/supabase/client';

export async function submitReport(input: SubmitReportInput): Promise<SubmitReportResult> {
  if (!supabase) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return submitReportResultSchema.parse({ id: input.idempotencyKey, status: 'unverified' });
  }

  const { data, error } = await supabase.functions.invoke('submit-report', { body: input });
  if (error) throw error;
  return submitReportResultSchema.parse(data);
}
