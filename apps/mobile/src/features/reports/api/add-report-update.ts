import {
  reportTimelineItemSchema,
  type AddReportUpdateInput,
  type ReportTimelineItem,
} from '@trending-map/contracts';

import { supabase } from '@/lib/supabase/client';

export async function addReportUpdate(input: AddReportUpdateInput): Promise<ReportTimelineItem> {
  if (!supabase) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return reportTimelineItemSchema.parse({
      id: input.idempotencyKey,
      reportId: input.reportId,
      kind: input.kind,
      body: input.body ?? null,
      operationalStatus: input.operationalStatus ?? null,
      official: false,
      sourceLabel: null,
      createdAt: new Date().toISOString(),
    });
  }

  const { data, error } = await supabase.functions.invoke('add-report-update', { body: input });
  if (error) throw error;

  return reportTimelineItemSchema.parse(data);
}
