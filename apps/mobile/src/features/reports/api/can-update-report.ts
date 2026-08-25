import { canUpdateReportResultSchema, type CanUpdateReportResult } from '@trending-map/contracts';

import { supabase } from '@/lib/supabase/client';

export async function canUpdateReport(reportId: string): Promise<CanUpdateReportResult> {
  if (!supabase) return { canUpdate: true };

  const { data, error } = await supabase.rpc('can_update_report', { p_report_id: reportId });
  if (error) throw error;

  return canUpdateReportResultSchema.parse({ canUpdate: data });
}
