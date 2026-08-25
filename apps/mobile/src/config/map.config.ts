import type { MapBounds } from '@trending-map/contracts';

export const mapConfig = {
  styleUrl: process.env.EXPO_PUBLIC_MAP_STYLE_URL ?? 'https://tiles.openfreemap.org/styles/liberty',
  defaultCenter: [106.701, 10.776] as [number, number],
  defaultBounds: {
    west: 106.63,
    south: 10.72,
    east: 106.76,
    north: 10.84,
  } satisfies MapBounds,
  defaultZoom: 13.2,
  minimumZoom: 9,
  focusedZoom: 15,
  viewportDebounceMs: 350,
  cameraDurationMs: 700,
} as const;

export const mapCategoryFilters = [
  { label: 'Tất cả', slugs: [] },
  { label: 'Giao thông', slugs: ['pothole'] },
  { label: 'Thời tiết', slugs: ['flood', 'storm'] },
  { label: 'Sự kiện', slugs: ['music'] },
] as const;

export const nearbyRadiusOptions = [
  { label: 'Gần nhất', radiusKm: 1 },
  { label: 'Quanh đây', radiusKm: 5 },
  { label: 'Khu vực rộng', radiusKm: 15 },
] as const;
