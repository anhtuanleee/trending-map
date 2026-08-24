import type { ReportDetail } from '@trending-map/contracts';

import { supabase } from '@/services/supabase';

import { demoReports } from './demo-data';

type PublicMapRow = {
  id: string;
  type: ReportDetail['type'];
  category_slug: string;
  category_name: string;
  title: string;
  longitude: number;
  latitude: number;
  severity: ReportDetail['severity'];
  verification_status: ReportDetail['verificationStatus'];
  operational_status: ReportDetail['operationalStatus'];
  starts_at: string;
  expires_at: string | null;
  confirmation_count: number;
};

export async function getMapReports(): Promise<ReportDetail[]> {
  if (!supabase) return demoReports;

  const { data, error } = await supabase.rpc('get_map_items', {
    p_west: 106.63,
    p_south: 10.72,
    p_east: 106.76,
    p_north: 10.84,
    p_category_slugs: [],
  });
  if (error) throw error;

  return ((data ?? []) as PublicMapRow[]).map((row) => ({
    id: row.id,
    type: row.type,
    categorySlug: row.category_slug,
    categoryName: row.category_name,
    title: row.title,
    description: '',
    coordinate: { latitude: row.latitude, longitude: row.longitude },
    severity: row.severity,
    verificationStatus: row.verification_status,
    operationalStatus: row.operational_status,
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    confirmationCount: row.confirmation_count,
    addressLabel: null,
    sourceLabel: null,
    mediaUrls: [],
    createdAt: row.starts_at,
  }));
}
