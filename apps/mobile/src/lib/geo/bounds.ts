import type { Coordinate, MapBounds } from '@trending-map/contracts';

export function boundsForRadius(center: Coordinate, radiusKm: number): MapBounds {
  const latitudeDelta = radiusKm / 111;
  const longitudeDelta = radiusKm / Math.max(20, 111 * Math.cos((center.latitude * Math.PI) / 180));

  return {
    west: center.longitude - longitudeDelta,
    south: center.latitude - latitudeDelta,
    east: center.longitude + longitudeDelta,
    north: center.latitude + latitudeDelta,
  };
}
