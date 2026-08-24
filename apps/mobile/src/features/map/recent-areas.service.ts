import { coordinateSchema, type Coordinate } from '@trending-map/contracts';
import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';

const recentAreasStorageKey = 'machpho.recent-areas.v1';
const maximumRecentAreas = 8;

const recentAreaSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(80),
  center: coordinateSchema,
  zoom: z.number().min(0).max(24),
  pinned: z.boolean(),
});

const recentAreasSchema = z.array(recentAreaSchema).max(maximumRecentAreas);

export type RecentArea = z.infer<typeof recentAreaSchema>;

function normalizeArea(center: Coordinate, zoom: number) {
  const normalizedCenter = {
    latitude: Number(center.latitude.toFixed(2)),
    longitude: Number(center.longitude.toFixed(2)),
  };
  return {
    center: normalizedCenter,
    zoom: Math.round(zoom * 2) / 2,
    id: `area:${normalizedCenter.latitude.toFixed(2)}:${normalizedCenter.longitude.toFixed(2)}`,
  };
}

function defaultAreaName(center: Coordinate) {
  return `Khu vực ${center.latitude.toFixed(2)}, ${center.longitude.toFixed(2)}`;
}

function orderAndLimit(areas: RecentArea[]) {
  return [...areas.filter((area) => area.pinned), ...areas.filter((area) => !area.pinned)].slice(
    0,
    maximumRecentAreas,
  );
}

async function persistRecentAreas(areas: RecentArea[]) {
  const normalized = orderAndLimit(areas);
  await SecureStore.setItemAsync(recentAreasStorageKey, JSON.stringify(normalized));
  return normalized;
}

export async function getRecentAreas(): Promise<RecentArea[]> {
  const raw = await SecureStore.getItemAsync(recentAreasStorageKey);
  if (!raw) return [];

  try {
    const parsed = recentAreasSchema.safeParse(JSON.parse(raw));
    return parsed.success ? orderAndLimit(parsed.data) : [];
  } catch {
    return [];
  }
}

export async function recordRecentArea(center: Coordinate, zoom: number): Promise<RecentArea[]> {
  const normalized = normalizeArea(center, zoom);
  const current = await getRecentAreas();
  const existing = current.find((area) => area.id === normalized.id);
  const next: RecentArea = {
    id: normalized.id,
    name: existing?.name ?? defaultAreaName(normalized.center),
    center: normalized.center,
    zoom: normalized.zoom,
    pinned: existing?.pinned ?? false,
  };

  return persistRecentAreas([next, ...current.filter((area) => area.id !== next.id)]);
}

export async function toggleRecentAreaPin(id: string): Promise<RecentArea[]> {
  const current = await getRecentAreas();
  return persistRecentAreas(
    current.map((area) => (area.id === id ? { ...area, pinned: !area.pinned } : area)),
  );
}
