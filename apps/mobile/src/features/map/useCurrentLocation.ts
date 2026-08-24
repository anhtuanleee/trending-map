import * as Location from 'expo-location';
import { Linking } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type LocationTrackingStatus =
  | 'idle'
  | 'checking'
  | 'requesting'
  | 'locating'
  | 'tracking'
  | 'denied'
  | 'blocked'
  | 'services_disabled'
  | 'error';

type LocationSource = 'last-known' | 'live' | null;

function permissionPrecision(permission: Location.LocationPermissionResponse) {
  if (permission.android?.accuracy === 'coarse' || permission.ios?.accuracy === 'reduced') {
    return 'approximate' as const;
  }
  return 'precise' as const;
}

export function useCurrentLocation() {
  const [status, setStatus] = useState<LocationTrackingStatus>('idle');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [source, setSource] = useState<LocationSource>(null);
  const [precision, setPrecision] = useState<'precise' | 'approximate' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const locationRef = useRef<Location.LocationObject | null>(null);
  const startingRef = useRef(false);
  const mountedRef = useRef(true);

  const updateLocation = useCallback(
    (next: Location.LocationObject, nextSource: LocationSource) => {
      locationRef.current = next;
      setLocation(next);
      setSource(nextSource);
    },
    [],
  );

  const stopTracking = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    setStatus('idle');
    setError(null);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, []);

  const startTracking = useCallback(async () => {
    if (subscriptionRef.current) {
      setStatus('tracking');
      return locationRef.current;
    }
    if (startingRef.current) return locationRef.current;

    startingRef.current = true;
    setStatus('checking');
    setError(null);

    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!mountedRef.current) return null;
      if (!servicesEnabled) {
        setStatus('services_disabled');
        setError('Dịch vụ vị trí đang tắt. Hãy bật vị trí trong Cài đặt.');
        return null;
      }

      let permission = await Location.getForegroundPermissionsAsync();
      if (!mountedRef.current) return null;
      if (!permission.granted) {
        if (!permission.canAskAgain) {
          setStatus('blocked');
          setError('Quyền vị trí đang bị chặn. Hãy mở Cài đặt để cấp lại quyền.');
          return null;
        }

        setStatus('requesting');
        permission = await Location.requestForegroundPermissionsAsync();
        if (!mountedRef.current) return null;
      }

      if (!permission.granted) {
        setStatus(permission.canAskAgain ? 'denied' : 'blocked');
        setError(
          permission.canAskAgain
            ? 'Mạch Phố cần quyền vị trí để hiển thị nội dung quanh bạn.'
            : 'Quyền vị trí đang bị chặn. Hãy mở Cài đặt để cấp lại quyền.',
        );
        return null;
      }

      setPrecision(permissionPrecision(permission));
      setStatus('locating');

      const lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: 5 * 60 * 1_000,
        requiredAccuracy: 1_000,
      });
      if (!mountedRef.current) return null;
      if (lastKnown) updateLocation(lastKnown, 'last-known');

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 20,
          timeInterval: 10_000,
          mayShowUserSettingsDialog: true,
        },
        (next) => {
          if (!mountedRef.current) return;
          updateLocation(next, 'live');
          setStatus('tracking');
          setError(null);
        },
        (message) => {
          if (!mountedRef.current) return;
          subscriptionRef.current?.remove();
          subscriptionRef.current = null;
          setStatus('error');
          setError(message || 'Không thể cập nhật vị trí hiện tại.');
        },
      );
      if (!mountedRef.current) {
        subscription.remove();
        return null;
      }
      subscriptionRef.current = subscription;

      setStatus('tracking');
      return lastKnown;
    } catch (caught) {
      if (!mountedRef.current) return null;
      setStatus('error');
      setError(caught instanceof Error ? caught.message : 'Không thể lấy vị trí hiện tại.');
      return null;
    } finally {
      startingRef.current = false;
    }
  }, [updateLocation]);

  const accuracyLabel = useMemo(() => {
    const accuracy = location?.coords.accuracy;
    if (accuracy == null) return null;
    return `±${Math.max(1, Math.round(accuracy))} m`;
  }, [location?.coords.accuracy]);

  return {
    status,
    location,
    source,
    precision,
    error,
    accuracyLabel,
    isBusy: ['checking', 'requesting', 'locating'].includes(status),
    isTracking: status === 'tracking',
    startTracking,
    stopTracking,
    openSettings: () => Linking.openSettings(),
  };
}
