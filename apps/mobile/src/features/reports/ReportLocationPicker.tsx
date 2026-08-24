import type { Coordinate } from '@trending-map/contracts';
import { Camera, Map, UserLocation } from '@maplibre/maplibre-react-native';
import type { CameraRef, ViewStateChangeEvent } from '@maplibre/maplibre-react-native';
import { Check, LocateFixed, MapPin, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import type { NativeSyntheticEvent } from 'react-native';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { colors, mapLayout, radius, spacing } from '@/theme';

import { formatCoordinateLabel, resolveAddressLabel } from './report-location.service';

const mapStyleUrl =
  process.env.EXPO_PUBLIC_MAP_STYLE_URL ?? 'https://demotiles.maplibre.org/style.json';

type SelectedReportLocation = {
  coordinate: Coordinate;
  addressLabel: string;
};

type ReportLocationPickerProps = {
  visible: boolean;
  initialCoordinate?: Coordinate;
  onClose: () => void;
  onSelect: (location: SelectedReportLocation) => void;
};

export function ReportLocationPicker({
  visible,
  initialCoordinate,
  onClose,
  onSelect,
}: ReportLocationPickerProps) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraRef>(null);
  const locateRequestedRef = useRef(false);
  const resolveRequestRef = useRef(0);
  const [coordinate, setCoordinate] = useState<Coordinate>(
    initialCoordinate ?? {
      longitude: mapLayout.defaultCenter[0],
      latitude: mapLayout.defaultCenter[1],
    },
  );
  const [isResolving, setIsResolving] = useState(false);
  const currentLocation = useCurrentLocation();

  useEffect(() => {
    if (!visible) return;
    const next =
      initialCoordinate ??
      ({
        longitude: mapLayout.defaultCenter[0],
        latitude: mapLayout.defaultCenter[1],
      } satisfies Coordinate);
    setCoordinate(next);
    cameraRef.current?.easeTo({
      center: [next.longitude, next.latitude],
      zoom: 16,
      duration: 350,
    });
  }, [initialCoordinate, visible]);

  useEffect(() => {
    if (!visible || !locateRequestedRef.current || !currentLocation.location) return;
    const next = {
      latitude: currentLocation.location.coords.latitude,
      longitude: currentLocation.location.coords.longitude,
    };
    locateRequestedRef.current = false;
    setCoordinate(next);
    cameraRef.current?.easeTo({
      center: [next.longitude, next.latitude],
      zoom: 17,
      duration: 500,
    });
  }, [currentLocation.location, visible]);

  const close = () => {
    resolveRequestRef.current += 1;
    locateRequestedRef.current = false;
    setIsResolving(false);
    currentLocation.stopTracking();
    onClose();
  };

  const handleLocate = async () => {
    if (currentLocation.isBusy) return;
    locateRequestedRef.current = true;
    const resolved = await currentLocation.startTracking();
    if (!resolved) return;

    locateRequestedRef.current = false;
    const next = {
      latitude: resolved.coords.latitude,
      longitude: resolved.coords.longitude,
    };
    setCoordinate(next);
    cameraRef.current?.easeTo({
      center: [next.longitude, next.latitude],
      zoom: 17,
      duration: 500,
    });
  };

  const handleRegionDidChange = (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
    const [longitude, latitude] = event.nativeEvent.center;
    setCoordinate({ latitude, longitude });
  };

  const handleConfirm = async () => {
    if (isResolving) return;
    const requestId = resolveRequestRef.current + 1;
    resolveRequestRef.current = requestId;
    setIsResolving(true);
    const addressLabel = await resolveAddressLabel(coordinate);
    if (resolveRequestRef.current !== requestId) return;
    setIsResolving(false);
    currentLocation.stopTracking();
    onSelect({ coordinate, addressLabel });
    onClose();
  };

  const locationActionIsSettings =
    currentLocation.status === 'blocked' || currentLocation.status === 'services_disabled';

  return (
    <Modal animationType="slide" onRequestClose={close} visible={visible}>
      <View style={styles.screen}>
        <Map
          style={styles.map}
          mapStyle={mapStyleUrl}
          compass={false}
          onRegionDidChange={handleRegionDidChange}
        >
          <Camera
            ref={cameraRef}
            initialViewState={{
              center: [coordinate.longitude, coordinate.latitude],
              zoom: 16,
            }}
            minZoom={mapLayout.minimumZoom}
          />
          {currentLocation.location ? <UserLocation animated accuracy /> : null}
        </Map>

        <View pointerEvents="none" style={styles.pinWrap}>
          <MapPin color={colors.primary} fill={colors.surface} size={42} strokeWidth={2.4} />
          <View style={styles.pinShadow} />
        </View>

        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable
            accessibilityLabel="Đóng chọn vị trí"
            style={styles.iconButton}
            onPress={close}
          >
            <X color={colors.ink} size={21} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Chọn vị trí báo cáo</Text>
            <Text style={styles.subtitle}>Kéo bản đồ để đặt pin đúng hiện trường</Text>
          </View>
        </View>

        <Pressable
          accessibilityLabel="Dùng vị trí hiện tại"
          disabled={currentLocation.isBusy}
          style={styles.locateButton}
          onPress={handleLocate}
        >
          {currentLocation.isBusy ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <LocateFixed color={colors.primary} size={22} />
          )}
        </Pressable>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
          {currentLocation.error ? (
            <Pressable
              style={styles.locationError}
              onPress={() =>
                locationActionIsSettings ? void currentLocation.openSettings() : void handleLocate()
              }
            >
              <Text style={styles.locationErrorText}>{currentLocation.error}</Text>
              <Text style={styles.locationErrorAction}>
                {locationActionIsSettings ? 'Mở Cài đặt' : 'Thử lại'}
              </Text>
            </Pressable>
          ) : null}
          <Text style={styles.coordinateLabel}>{formatCoordinateLabel(coordinate)}</Text>
          <Text style={styles.privacyCopy}>
            Tọa độ được dùng để tìm nhãn địa chỉ khi xác nhận pin và chỉ lưu khi mày đăng báo cáo.
          </Text>
          <Pressable
            disabled={isResolving}
            style={[styles.confirmButton, isResolving && styles.disabled]}
            onPress={() => void handleConfirm()}
          >
            {isResolving ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <>
                <Check color={colors.surface} size={20} />
                <Text style={styles.confirmText}>Dùng vị trí này</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  map: { flex: 1 },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.canvas,
  },
  headerCopy: { flex: 1 },
  title: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  subtitle: { marginTop: 2, color: colors.inkMuted, fontSize: 12 },
  pinWrap: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    alignItems: 'center',
    transform: [{ translateX: -21 }, { translateY: -42 }],
  },
  pinShadow: {
    width: 16,
    height: 5,
    marginTop: -2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(16,35,31,0.25)',
  },
  locateButton: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 254,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: colors.surface,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  coordinateLabel: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  privacyCopy: { marginTop: spacing.xs, color: colors.inkMuted, fontSize: 12, lineHeight: 17 },
  locationError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.canvas,
    padding: spacing.md,
  },
  locationErrorText: { flex: 1, color: colors.danger, fontSize: 12, lineHeight: 17 },
  locationErrorAction: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  confirmButton: {
    minHeight: 54,
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  confirmText: { color: colors.surface, fontSize: 15, fontWeight: '900' },
  disabled: { opacity: 0.6 },
});
