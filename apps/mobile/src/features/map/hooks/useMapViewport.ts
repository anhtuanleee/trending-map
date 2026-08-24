import type { MapBounds } from '@trending-map/contracts';
import type { ViewStateChangeEvent } from '@maplibre/maplibre-react-native';
import { useEffect, useRef, useState } from 'react';
import type { NativeSyntheticEvent } from 'react-native';

import { mapConfig } from '@/config';

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

  const handleRegionDidChange = (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
    const [west, south, east, north] = event.nativeEvent.bounds;
    const [longitude, latitude] = event.nativeEvent.center;
    const nextZoom = event.nativeEvent.zoom;
    const userInteraction = event.nativeEvent.userInteraction;
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
