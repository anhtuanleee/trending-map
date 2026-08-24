import type { Coordinate, MapBounds, ReportDetail } from '@trending-map/contracts';

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
  distance_meters: number | null;
};

export type MapReportsRequest = {
  bounds?: MapBounds;
  categorySlugs?: string[];
  center?: Coordinate | null;
  radiusMeters?: number | null;
};

const defaultBounds: MapBounds = {
  west: 106.63,
  south: 10.72,
  east: 106.76,
  north: 10.84,
};

const severityRank: Record<ReportDetail['severity'], number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

const verificationRank: Record<ReportDetail['verificationStatus'], number> = {
  official_verified: 4,
  community_verified: 3,
  unverified: 2,
  disputed: 1,
};

function distanceMeters(from: Coordinate, to: Coordinate) {
  const earthRadius = 6_371_000;
  const latitudeDelta = ((to.latitude - from.latitude) * Math.PI) / 180;
  const longitudeDelta = ((to.longitude - from.longitude) * Math.PI) / 180;
  const fromLatitude = (from.latitude * Math.PI) / 180;
  const toLatitude = (to.latitude * Math.PI) / 180;
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(haversine));
}

function sortNearbyReports(left: ReportDetail, right: ReportDetail) {
  return (
    severityRank[right.severity] - severityRank[left.severity] ||
    (left.distanceMeters ?? Number.POSITIVE_INFINITY) -
      (right.distanceMeters ?? Number.POSITIVE_INFINITY) ||
    Date.parse(right.startsAt) - Date.parse(left.startsAt) ||
    verificationRank[right.verificationStatus] - verificationRank[left.verificationStatus]
  );
}

export async function getMapReports(request: MapReportsRequest = {}): Promise<ReportDetail[]> {
  const bounds = request.bounds ?? defaultBounds;
  const categorySlugs = request.categorySlugs ?? [];
  const center = request.center ?? null;
  const radiusMeters = request.radiusMeters ?? null;

  if (!supabase) {
    return demoReports
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
      .sort(sortNearbyReports);
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
    distanceMeters: row.distance_meters,
    addressLabel: null,
    sourceLabel: null,
    mediaUrls: [],
    createdAt: row.starts_at,
  }));
}
