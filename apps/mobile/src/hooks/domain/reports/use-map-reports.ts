import { useQuery } from '@tanstack/react-query';
import type { Coordinate, MapBounds } from '@trending-map/contracts';

import { getMapReports } from '@/features/map/map.service';

import { reportQueryKeys } from './query-keys';

const nearbyRadiusKm = 5;

function nearbyQuery(center: Coordinate | null): { scope: string; bounds?: MapBounds } {
  if (!center) return { scope: 'hcm-center' };

  const latitude = Number(center.latitude.toFixed(2));
  const longitude = Number(center.longitude.toFixed(2));
  const latitudeDelta = nearbyRadiusKm / 111;
  const longitudeDelta = nearbyRadiusKm / Math.max(20, 111 * Math.cos((latitude * Math.PI) / 180));

  return {
    scope: `nearby:${latitude}:${longitude}:${nearbyRadiusKm}`,
    bounds: {
      west: longitude - longitudeDelta,
      south: latitude - latitudeDelta,
      east: longitude + longitudeDelta,
      north: latitude + latitudeDelta,
    },
  };
}

export function useMapReports(center: Coordinate | null = null) {
  const query = nearbyQuery(center);

  return useQuery({
    queryKey: reportQueryKeys.map(query.scope),
    queryFn: () => getMapReports(query.bounds),
    placeholderData: (previous) => previous,
    staleTime: 30_000,
  });
}
