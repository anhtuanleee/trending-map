import type { Coordinate } from '@trending-map/contracts';

const earthRadiusMeters = 6_371_000;

export function distanceMeters(from: Coordinate, to: Coordinate) {
  const latitudeDelta = ((to.latitude - from.latitude) * Math.PI) / 180;
  const longitudeDelta = ((to.longitude - from.longitude) * Math.PI) / 180;
  const fromLatitude = (from.latitude * Math.PI) / 180;
  const toLatitude = (to.latitude * Math.PI) / 180;
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(haversine));
}
