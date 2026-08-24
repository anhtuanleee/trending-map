import type { ConfirmationInput, ReportDetail, SubmitReportInput } from '@trending-map/contracts';

import { supabase } from '@/services/supabase';

import { demoReports } from '../map/demo-data';

export async function getReportById(id: string): Promise<ReportDetail | null> {
  if (!supabase) return demoReports.find((report) => report.id === id) ?? null;

  const { data, error } = await supabase
    .from('public_report_details')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
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
  };
}

export async function submitReport(input: SubmitReportInput) {
  if (!supabase) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { id: input.idempotencyKey, status: 'unverified' as const };
  }

  const { data, error } = await supabase.functions.invoke('submit-report', { body: input });
  if (error) throw error;
  return data as { id: string; status: 'unverified' };
}

export async function confirmReport(input: ConfirmationInput) {
  if (!supabase) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return { reportId: input.reportId, accepted: true };
  }

  const { data, error } = await supabase.functions.invoke('confirm-report', { body: input });
  if (error) throw error;
  return data as { reportId: string; accepted: boolean };
}
