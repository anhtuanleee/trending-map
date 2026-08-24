import type { Coordinate } from '@trending-map/contracts';

export function formatCoordinate(coordinate: Coordinate, decimals = 5) {
  return `${coordinate.latitude.toFixed(decimals)}, ${coordinate.longitude.toFixed(decimals)}`;
}

export function formatAccuracy(accuracyMeters: number | null | undefined) {
  if (accuracyMeters == null) return null;
  return `±${Math.max(1, Math.round(accuracyMeters))} m`;
}

export function formatDistance(distanceMeters: number | null | undefined) {
  if (distanceMeters == null) return 'Chưa rõ khoảng cách';
  if (distanceMeters < 1_000) return `${Math.max(1, Math.round(distanceMeters))} m`;
  return `${(distanceMeters / 1_000).toFixed(distanceMeters < 10_000 ? 1 : 0)} km`;
}
