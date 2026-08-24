import type { Coordinate } from '@trending-map/contracts';
import * as Location from 'expo-location';

import { formatCoordinate } from '@/lib/format';

export async function resolveAddressLabel(coordinate: Coordinate): Promise<string> {
  try {
    const [address] = await Location.reverseGeocodeAsync(coordinate);
    if (!address) return formatCoordinate(coordinate);

    if (address.formattedAddress?.trim()) return address.formattedAddress.trim();

    const street = [address.streetNumber, address.street].filter(Boolean).join(' ').trim();
    const parts = [street || address.name, address.district, address.city, address.region]
      .map((part) => part?.trim())
      .filter((part): part is string => Boolean(part));
    const uniqueParts = [...new Set(parts)];

    return uniqueParts.join(', ') || formatCoordinate(coordinate);
  } catch {
    return formatCoordinate(coordinate);
  }
}
