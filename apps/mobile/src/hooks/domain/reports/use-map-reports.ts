import { useQuery } from '@tanstack/react-query';
import type { MapBounds } from '@trending-map/contracts';

import { getMapReports } from '@/features/map/map.service';

import { reportQueryKeys } from './query-keys';

function normalizeBounds(bounds: MapBounds | null): MapBounds | null {
  if (!bounds) return null;
  return {
    west: Number(bounds.west.toFixed(4)),
    south: Number(bounds.south.toFixed(4)),
    east: Number(bounds.east.toFixed(4)),
    north: Number(bounds.north.toFixed(4)),
  };
}

export function useMapReports(bounds: MapBounds | null = null) {
  const normalized = normalizeBounds(bounds);
  const scope = normalized
    ? `viewport:${normalized.west}:${normalized.south}:${normalized.east}:${normalized.north}`
    : 'hcm-center';

  return useQuery({
    queryKey: reportQueryKeys.map(scope),
    queryFn: () => getMapReports(normalized ?? undefined),
    placeholderData: (previous) => previous,
    staleTime: 30_000,
  });
}
