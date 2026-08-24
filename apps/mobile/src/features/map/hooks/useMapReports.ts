import { useQuery } from '@tanstack/react-query';
import type { Coordinate, MapBounds } from '@trending-map/contracts';

import { mapConfig } from '@/config';
import { boundsForRadius, roundBounds, roundCoordinate } from '@/lib/geo';

import { getMapReports } from '../api/get-map-reports';
import { mapReportQueryKeys } from '../model/map-report-query-keys';

export type MapReportsQuery = {
  bounds: MapBounds | null;
  zoom: number;
  categorySlugs: string[];
  center: Coordinate;
};

export function useMapReports(query: MapReportsQuery) {
  const bounds = query.bounds ? roundBounds(query.bounds, 4) : null;
  const center = roundCoordinate(query.center, 4);
  const zoom = Number(query.zoom.toFixed(1));
  const filters = [...query.categorySlugs].sort();
  const boundsScope = bounds
    ? `${bounds.west}:${bounds.south}:${bounds.east}:${bounds.north}`
    : 'hcm-center';
  const scope = `${boundsScope}:z${zoom}:f${filters.join(',') || 'all'}:c${center.latitude}:${center.longitude}`;

  return useQuery({
    queryKey: mapReportQueryKeys.viewport(scope),
    queryFn: () =>
      getMapReports({
        bounds: bounds ?? mapConfig.defaultBounds,
        categorySlugs: filters,
        center,
        radiusMeters: null,
      }),
    placeholderData: (previous) => previous,
    staleTime: 30_000,
  });
}

export function useNearbyReports(
  centerInput: Coordinate,
  radiusKm: number,
  categorySlugs: string[],
) {
  const center = roundCoordinate(centerInput, 4);
  const filters = [...categorySlugs].sort();
  const scope = `${center.latitude}:${center.longitude}:r${radiusKm}:f${filters.join(',') || 'all'}`;

  return useQuery({
    queryKey: mapReportQueryKeys.nearby(scope),
    queryFn: () =>
      getMapReports({
        bounds: boundsForRadius(center, radiusKm),
        categorySlugs: filters,
        center,
        radiusMeters: radiusKm * 1_000,
      }),
    placeholderData: (previous) => previous,
    staleTime: 30_000,
  });
}
