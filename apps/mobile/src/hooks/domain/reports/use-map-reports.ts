import { useQuery } from '@tanstack/react-query';
import type { Coordinate, MapBounds } from '@trending-map/contracts';

import { getMapReports } from '@/features/map/map.service';

import { reportQueryKeys } from './query-keys';

export type MapReportsQuery = {
  bounds: MapBounds | null;
  zoom: number;
  categorySlugs: string[];
  center: Coordinate;
};

function normalizeBounds(bounds: MapBounds | null): MapBounds | null {
  if (!bounds) return null;
  return {
    west: Number(bounds.west.toFixed(4)),
    south: Number(bounds.south.toFixed(4)),
    east: Number(bounds.east.toFixed(4)),
    north: Number(bounds.north.toFixed(4)),
  };
}

function normalizeCenter(center: Coordinate) {
  return {
    latitude: Number(center.latitude.toFixed(4)),
    longitude: Number(center.longitude.toFixed(4)),
  };
}

function radiusBounds(center: Coordinate, radiusKm: number): MapBounds {
  const latitudeDelta = radiusKm / 111;
  const longitudeDelta = radiusKm / Math.max(20, 111 * Math.cos((center.latitude * Math.PI) / 180));
  return {
    west: center.longitude - longitudeDelta,
    south: center.latitude - latitudeDelta,
    east: center.longitude + longitudeDelta,
    north: center.latitude + latitudeDelta,
  };
}

export function useMapReports(query: MapReportsQuery) {
  const bounds = normalizeBounds(query.bounds);
  const center = normalizeCenter(query.center);
  const zoom = Number(query.zoom.toFixed(1));
  const filters = [...query.categorySlugs].sort();
  const boundsScope = bounds
    ? `${bounds.west}:${bounds.south}:${bounds.east}:${bounds.north}`
    : 'hcm-center';
  const scope = `${boundsScope}:z${zoom}:f${filters.join(',') || 'all'}:c${center.latitude}:${center.longitude}`;

  return useQuery({
    queryKey: reportQueryKeys.map(scope),
    queryFn: () => getMapReports({ bounds: bounds ?? undefined, categorySlugs: filters, center }),
    placeholderData: (previous) => previous,
    staleTime: 30_000,
  });
}

export function useNearbyReports(
  centerInput: Coordinate,
  radiusKm: number,
  categorySlugs: string[],
) {
  const center = normalizeCenter(centerInput);
  const filters = [...categorySlugs].sort();
  const scope = `${center.latitude}:${center.longitude}:r${radiusKm}:f${filters.join(',') || 'all'}`;

  return useQuery({
    queryKey: reportQueryKeys.nearby(scope),
    queryFn: () =>
      getMapReports({
        bounds: radiusBounds(center, radiusKm),
        categorySlugs: filters,
        center,
        radiusMeters: radiusKm * 1_000,
      }),
    placeholderData: (previous) => previous,
    staleTime: 30_000,
  });
}
