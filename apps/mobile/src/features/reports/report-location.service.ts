import type { Coordinate } from '@trending-map/contracts';
import * as Location from 'expo-location';

export function formatCoordinateLabel(coordinate: Coordinate) {
  return `${coordinate.latitude.toFixed(5)}, ${coordinate.longitude.toFixed(5)}`;
}

export async function resolveAddressLabel(coordinate: Coordinate): Promise<string> {
  try {
    const [address] = await Location.reverseGeocodeAsync(coordinate);
    if (!address) return formatCoordinateLabel(coordinate);

    if (address.formattedAddress?.trim()) return address.formattedAddress.trim();

    const street = [address.streetNumber, address.street].filter(Boolean).join(' ').trim();
    const parts = [street || address.name, address.district, address.city, address.region]
      .map((part) => part?.trim())
      .filter((part): part is string => Boolean(part));
    const uniqueParts = [...new Set(parts)];

    return uniqueParts.join(', ') || formatCoordinateLabel(coordinate);
  } catch {
    return formatCoordinateLabel(coordinate);
  }
}
