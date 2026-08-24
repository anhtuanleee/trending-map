import { reportDetailSchema, type ReportDetail } from '@trending-map/contracts';

import { supabase } from '@/lib/supabase/client';
import { demoReports } from '@/mocks/reports';

export async function getReportById(id: string): Promise<ReportDetail | null> {
  if (!supabase) {
    const report = demoReports.find((item) => item.id === id);
    return report ? reportDetailSchema.parse(report) : null;
  }

  const { data, error } = await supabase
    .from('public_report_details')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return reportDetailSchema.parse({
    id: data.id,
    type: data.type,
    categorySlug: data.category_slug,
    categoryName: data.category_name,
    title: data.title,
    description: data.description,
    coordinate: { latitude: data.latitude, longitude: data.longitude },
    severity: data.severity,
    verificationStatus: data.verification_status,
    operationalStatus: data.operational_status,
    startsAt: data.starts_at,
    expiresAt: data.expires_at,
    confirmationCount: data.confirmation_count,
    addressLabel: data.address_label,
    sourceLabel: data.source_label,
    mediaUrls: data.media_urls ?? [],
    createdAt: data.created_at,
  });
}
