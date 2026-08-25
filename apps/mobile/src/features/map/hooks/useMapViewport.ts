import type { MapBounds } from '@trending-map/contracts';
import { useEffect, useRef, useState } from 'react';

import { mapConfig } from '@/config';

import type { MapViewportChange } from '../model/map-viewport';

type Options = {
  onUserInteraction: () => void;
  onUserRegionChange: (center: { latitude: number; longitude: number }, zoom: number) => void;
};

export function useMapViewport({ onUserInteraction, onUserRegionChange }: Options) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [zoom, setZoom] = useState<number>(mapConfig.defaultZoom);
  const [center, setCenter] = useState({
    longitude: mapConfig.defaultCenter[0],
    latitude: mapConfig.defaultCenter[1],
  });

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const handleRegionDidChange = (change: MapViewportChange) => {
    const [west, south, east, north] = change.bounds;
    const [longitude, latitude] = change.center;
    const nextZoom = change.zoom;
    const userInteraction = change.userInteraction;
    if (west >= east || south >= north) return;
    if (userInteraction) onUserInteraction();

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setBounds({ west, south, east, north });
      setZoom(nextZoom);
      setCenter({ longitude, latitude });
      if (userInteraction) onUserRegionChange({ longitude, latitude }, nextZoom);
    }, mapConfig.viewportDebounceMs);
  };

  return { bounds, zoom, center, handleRegionDidChange };
}
