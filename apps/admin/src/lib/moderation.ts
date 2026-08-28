import type { SupabaseClient } from '@supabase/supabase-js';
import {
  moderateReportMediaResultSchema,
  reportMediaModerationQueueSchema,
  moderateReportCaseResultSchema,
  reportModerationQueueSchema,
  type ModerateReportCaseInput,
  type ModerateReportCaseResult,
  type ModerateReportMediaInput,
  type ModerateReportMediaResult,
  type ReportMediaModerationItem,
  type ReportModerationItem,
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

export const demoReportQueue: ReportModerationItem[] = [
  {
    caseId: '543eb56e-b826-43b4-9d51-0068fc7c55d6',
    reportId: '42a37a67-b480-4809-8658-97cfcbd34c63',
    type: 'incident',
    categoryName: 'Ngập nước',
    title: 'Ngập sâu trên đường Nguyễn Huệ',
    description: 'Nước đang dâng nhanh, xe máy khó di chuyển và cần tránh làn sát vỉa hè.',
    addressLabel: 'Quận 1, TP.HCM',
    severity: 'high',
    verificationStatus: 'disputed',
    operationalStatus: 'active',
    moderationStatus: 'fact_checking',
    visibilityStatus: 'labeled',
    openFlagCount: 2,
    flagReasons: ['false_information', 'incorrect_location'],
    confirmationCount: 14,
    notThereCount: 5,
    startsAt: new Date(Date.now() - 18 * 60_000).toISOString(),
    expiresAt: new Date(Date.now() + 4 * 60 * 60_000).toISOString(),
    createdAt: new Date(Date.now() - 20 * 60_000).toISOString(),
    priority: 5,
    caseStatus: 'open',
    queueReason: 'community_disputed',
  },
  {
    caseId: 'b6062a3c-6608-4ea9-8718-467256bedb6c',
    reportId: 'b4d16486-3422-4a26-b3b7-cefc0b73c21d',
    type: 'incident',
    categoryName: 'Ổ gà',
    title: 'Ổ gà lớn sát giao lộ',
    description: 'Mặt đường lún sâu ở làn xe máy, khó nhìn thấy khi trời tối.',
    addressLabel: 'Quận Bình Thạnh, TP.HCM',
    severity: 'medium',
    verificationStatus: 'unverified',
    operationalStatus: 'active',
    moderationStatus: 'pending_review',
    visibilityStatus: 'labeled',
    openFlagCount: 0,
    flagReasons: [],
    confirmationCount: 1,
    notThereCount: 0,
    startsAt: new Date(Date.now() - 35 * 60_000).toISOString(),
    expiresAt: new Date(Date.now() + 22 * 60 * 60_000).toISOString(),
    createdAt: new Date(Date.now() - 36 * 60_000).toISOString(),
    priority: 2,
    caseStatus: 'open',
    queueReason: 'new_report',
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

export async function getReportModerationQueue(
  supabase: SupabaseClient,
): Promise<ReportModerationItem[]> {
  const { data, error } = await supabase.functions.invoke('get-report-moderation-queue', {
    body: {},
  });
  if (error) throw error;
  return reportModerationQueueSchema.parse(data?.items ?? []);
}

export async function moderateReport(
  supabase: SupabaseClient,
  input: ModerateReportCaseInput,
): Promise<ModerateReportCaseResult> {
  const { data, error } = await supabase.functions.invoke('moderate-report-case', {
    body: input,
  });
  if (error) throw error;
  return moderateReportCaseResultSchema.parse(data);
}
