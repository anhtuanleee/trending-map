import type { SupabaseClient } from '@supabase/supabase-js';
import {
  moderateReportMediaResultSchema,
  reportMediaModerationQueueSchema,
  type ModerateReportMediaInput,
  type ModerateReportMediaResult,
  type ReportMediaModerationItem,
} from '@trending-map/contracts';

export const demoMediaQueue: ReportMediaModerationItem[] = [
  {
    mediaId: '2e130699-a737-4942-bf43-f9f217bdf84b',
    reportId: '42a37a67-b480-4809-8658-97cfcbd34c63',
    reportTitle: 'Ngập sâu trên đường Nguyễn Huệ',
    categoryName: 'Ngập nước',
    addressLabel: 'Quận 1, TP.HCM',
    severity: 'high',
    mimeType: 'image/jpeg',
    width: 1280,
    height: 960,
    fileSizeBytes: 420_000,
    uploadedAt: new Date(Date.now() - 8 * 60_000).toISOString(),
    status: 'uploaded',
    previewUrl:
      'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1200&q=80',
  },
  {
    mediaId: '966922b1-d61e-43a3-a26a-c21c802dbe11',
    reportId: 'b4d16486-3422-4a26-b3b7-cefc0b73c21d',
    reportTitle: 'Cây lớn chắn một phần đường',
    categoryName: 'Cây đổ',
    addressLabel: 'Quận 3, TP.HCM',
    severity: 'critical',
    mimeType: 'image/jpeg',
    width: 1600,
    height: 1200,
    fileSizeBytes: 780_000,
    uploadedAt: new Date(Date.now() - 42 * 60_000).toISOString(),
    status: 'uploaded',
    previewUrl:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
  },
];

export async function getMediaModerationQueue(
  supabase: SupabaseClient,
): Promise<ReportMediaModerationItem[]> {
  const { data, error } = await supabase.functions.invoke('get-report-media-moderation-queue', {
    body: {},
  });
  if (error) throw error;
  return reportMediaModerationQueueSchema.parse(data?.items ?? []);
}

export async function moderateMedia(
  supabase: SupabaseClient,
  input: ModerateReportMediaInput,
): Promise<ModerateReportMediaResult> {
  const { data, error } = await supabase.functions.invoke('moderate-report-media', {
    body: input,
  });
  if (error) throw error;
  return moderateReportMediaResultSchema.parse(data);
}
