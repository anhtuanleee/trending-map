import { reportTimelineSchema, type ReportTimelineItem } from '@trending-map/contracts';

import { supabase } from '@/lib/supabase/client';

export async function getReportTimeline(reportId: string): Promise<ReportTimelineItem[]> {
  if (!supabase) {
    return reportTimelineSchema.parse([
      {
        id: 'b2704277-dbc4-4615-99f9-ab8448877c9f',
        reportId,
        kind: 'note',
        body: 'Thông tin ban đầu đã được cộng đồng ghi nhận.',
        operationalStatus: null,
        official: false,
        sourceLabel: null,
        createdAt: '2026-08-25T04:00:00.000Z',
      },
    ]);
  }

  const { data, error } = await supabase.rpc('get_report_timeline', {
    p_report_id: reportId,
  });
  if (error) throw error;

  return reportTimelineSchema.parse(
    (data ?? []).map(
      (row: {
        id: string;
        report_id: string;
        kind: string;
        body: string | null;
        operational_status: string | null;
        official: boolean;
        source_label: string | null;
        created_at: string;
      }) => ({
        id: row.id,
        reportId: row.report_id,
        kind: row.kind,
        body: row.body,
        operationalStatus: row.operational_status,
        official: row.official,
        sourceLabel: row.source_label,
        createdAt: row.created_at,
      }),
    ),
  );
}
