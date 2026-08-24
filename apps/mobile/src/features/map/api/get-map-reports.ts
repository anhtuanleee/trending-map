import { mapItemSchema, type MapItem, type MapReportsRequest } from '@trending-map/contracts';

import { distanceMeters } from '@/lib/geo';
import { supabase } from '@/lib/supabase/client';
import { demoReports } from '@/mocks/reports';

import { sortNearbyReports } from '../domain/report-ranking';

type PublicMapRow = {
  id: string;
  type: MapItem['type'];
  category_slug: string;
  category_name: string;
  title: string;
  longitude: number;
  latitude: number;
  severity: MapItem['severity'];
  verification_status: MapItem['verificationStatus'];
  operational_status: MapItem['operationalStatus'];
  starts_at: string;
  expires_at: string | null;
  confirmation_count: number;
  distance_meters: number | null;
};

export async function getMapReports(request: MapReportsRequest): Promise<MapItem[]> {
  const { bounds, categorySlugs, center, radiusMeters } = request;

  if (!supabase) {
    return mapItemSchema.array().parse(
      demoReports
        .filter(
          (report) =>
            report.coordinate.longitude >= bounds.west &&
            report.coordinate.longitude <= bounds.east &&
            report.coordinate.latitude >= bounds.south &&
            report.coordinate.latitude <= bounds.north &&
            (categorySlugs.length === 0 || categorySlugs.includes(report.categorySlug)),
        )
        .map((report) => ({
          ...report,
          distanceMeters: center ? distanceMeters(center, report.coordinate) : null,
        }))
        .filter(
          (report) =>
            radiusMeters == null ||
            report.distanceMeters == null ||
            report.distanceMeters <= radiusMeters,
        )
        .sort(sortNearbyReports),
    );
  }

  const { data, error } = await supabase.rpc('get_map_items', {
    p_west: bounds.west,
    p_south: bounds.south,
    p_east: bounds.east,
    p_north: bounds.north,
    p_category_slugs: categorySlugs,
    p_center_longitude: center?.longitude ?? null,
    p_center_latitude: center?.latitude ?? null,
    p_radius_meters: radiusMeters,
  });
  if (error) throw error;

  return mapItemSchema.array().parse(
    ((data ?? []) as PublicMapRow[]).map((row) => ({
      id: row.id,
      type: row.type,
      categorySlug: row.category_slug,
      categoryName: row.category_name,
      title: row.title,
      coordinate: { latitude: row.latitude, longitude: row.longitude },
      severity: row.severity,
      verificationStatus: row.verification_status,
      operationalStatus: row.operational_status,
      startsAt: row.starts_at,
      expiresAt: row.expires_at,
      confirmationCount: row.confirmation_count,
      distanceMeters: row.distance_meters,
    })),
  );
}
