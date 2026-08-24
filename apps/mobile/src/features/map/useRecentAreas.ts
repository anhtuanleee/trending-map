import type { Coordinate } from '@trending-map/contracts';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getRecentAreas,
  recordRecentArea,
  toggleRecentAreaPin,
  type RecentArea,
} from './recent-areas.service';

export function useRecentAreas() {
  const [areas, setAreas] = useState<RecentArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const operationRef = useRef(Promise.resolve<RecentArea[]>([]));

  useEffect(() => {
    mountedRef.current = true;
    void getRecentAreas()
      .then((stored) => {
        if (mountedRef.current) setAreas(stored);
      })
      .catch(() => {
        if (mountedRef.current) setError('Không thể đọc khu vực gần đây.');
      })
      .finally(() => {
        if (mountedRef.current) setIsLoading(false);
      });

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const enqueue = useCallback(
    (operation: () => Promise<RecentArea[]>) => {
      operationRef.current = operationRef.current
        .catch(() => [])
        .then(operation)
        .then((next) => {
          if (mountedRef.current) {
            setAreas(next);
            setError(null);
          }
          return next;
        })
        .catch(() => {
          if (mountedRef.current) setError('Không thể lưu khu vực gần đây.');
          return areas;
        });
      return operationRef.current;
    },
    [areas],
  );

  const record = useCallback(
    (center: Coordinate, zoom: number) => enqueue(() => recordRecentArea(center, zoom)),
    [enqueue],
  );

  const togglePin = useCallback((id: string) => enqueue(() => toggleRecentAreaPin(id)), [enqueue]);

  return { areas, isLoading, error, record, togglePin };
}
