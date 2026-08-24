import type { Coordinate, MapBounds } from '@trending-map/contracts';

export function roundCoordinate(coordinate: Coordinate, decimals: number): Coordinate {
  return {
    latitude: Number(coordinate.latitude.toFixed(decimals)),
    longitude: Number(coordinate.longitude.toFixed(decimals)),
  };
}

export function roundBounds(bounds: MapBounds, decimals: number): MapBounds {
  return {
    west: Number(bounds.west.toFixed(decimals)),
    south: Number(bounds.south.toFixed(decimals)),
    east: Number(bounds.east.toFixed(decimals)),
    north: Number(bounds.north.toFixed(decimals)),
  };
}
