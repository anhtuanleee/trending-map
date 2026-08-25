import { Check, LocateFixed, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { mapConfig } from '@/config';
import { resolveAddressLabel, useCurrentLocation } from '@/features/location';
import { formatCoordinate } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';

import type { ReportLocationPickerProps } from './ReportLocationPicker.types';

type CoordinateSource = 'unset' | 'existing' | 'gps' | 'manual';

export function ReportLocationPicker({
  visible,
  initialCoordinate,
  onClose,
  onSelect,
}: ReportLocationPickerProps) {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [coordinateSource, setCoordinateSource] = useState<CoordinateSource>(
    initialCoordinate ? 'existing' : 'unset',
  );
  const requestRef = useRef(0);
  const currentLocation = useCurrentLocation();

  useEffect(() => {
    if (!visible) {
      requestRef.current += 1;
      return;
    }
    const coordinate = initialCoordinate ?? {
      longitude: mapConfig.defaultCenter[0],
      latitude: mapConfig.defaultCenter[1],
    };
    setLatitude(String(coordinate.latitude));
    setLongitude(String(coordinate.longitude));
    setCoordinateSource(initialCoordinate ? 'existing' : 'unset');
    setError(null);
  }, [initialCoordinate, visible]);

  const close = () => {
    requestRef.current += 1;
    currentLocation.stopTracking();
    setIsResolving(false);
    onClose();
  };

  const handleLocate = async () => {
    if (currentLocation.isBusy) return;
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setError(null);
    const location = await currentLocation.startTracking();
    if (!location || requestRef.current !== requestId) return;
    setLatitude(String(location.coords.latitude));
    setLongitude(String(location.coords.longitude));
    setCoordinateSource('gps');
  };

  const handleConfirm = async () => {
    if (isResolving) return;
    if (coordinateSource === 'unset') {
      setError('Nhập tọa độ hoặc dùng vị trí hiện tại trước khi xác nhận.');
      return;
    }
    const coordinate = { latitude: Number(latitude), longitude: Number(longitude) };
    if (
      !Number.isFinite(coordinate.latitude) ||
      !Number.isFinite(coordinate.longitude) ||
      coordinate.latitude < -90 ||
      coordinate.latitude > 90 ||
      coordinate.longitude < -180 ||
      coordinate.longitude > 180
    ) {
      setError('Nhập vĩ độ từ -90 đến 90 và kinh độ từ -180 đến 180.');
      return;
    }

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setIsResolving(true);
    const addressLabel = await resolveAddressLabel(coordinate);
    if (requestRef.current !== requestId) return;
    setIsResolving(false);
    currentLocation.stopTracking();
    onSelect({ coordinate, addressLabel });
    onClose();
  };

  const coordinate = { latitude: Number(latitude), longitude: Number(longitude) };
  const hasValidNumbers =
    Number.isFinite(coordinate.latitude) && Number.isFinite(coordinate.longitude);

  const updateCoordinate = (field: 'latitude' | 'longitude', value: string) => {
    requestRef.current += 1;
    setIsResolving(false);
    setCoordinateSource('manual');
    setError(null);
    if (field === 'latitude') setLatitude(value);
    else setLongitude(value);
  };

  return (
    <Modal animationType="slide" onRequestClose={close} visible={visible}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Đóng chọn vị trí"
            style={styles.iconButton}
            onPress={close}
          >
            <X color={colors.ink} size={21} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Chọn vị trí báo cáo</Text>
            <Text style={styles.subtitle}>Nhập tọa độ hoặc dùng vị trí trình duyệt</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.notice}>
            Bản đồ kéo pin sử dụng native MapLibre trên Android/iOS. Trên web, bạn vẫn có thể chọn
            vị trí chính xác bằng tọa độ hoặc GPS.
          </Text>

          <View style={styles.fieldRow}>
            <View style={styles.field}>
              <Text style={styles.label}>Vĩ độ</Text>
              <TextInput
                inputMode="decimal"
                value={latitude}
                onChangeText={(value) => updateCoordinate('latitude', value)}
                placeholder="10.776"
                style={styles.input}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Kinh độ</Text>
              <TextInput
                inputMode="decimal"
                value={longitude}
                onChangeText={(value) => updateCoordinate('longitude', value)}
                placeholder="106.701"
                style={styles.input}
              />
            </View>
          </View>

          <Pressable
            accessibilityLabel="Dùng vị trí hiện tại"
            disabled={currentLocation.isBusy}
            style={styles.locateButton}
            onPress={() => void handleLocate()}
          >
            {currentLocation.isBusy ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <LocateFixed color={colors.primary} size={20} />
            )}
            <Text style={styles.locateText}>Dùng vị trí hiện tại</Text>
          </Pressable>

          {hasValidNumbers ? (
            <Text style={styles.coordinateLabel}>{formatCoordinate(coordinate)}</Text>
          ) : null}
          {currentLocation.error ? <Text style={styles.error}>{currentLocation.error}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

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
  header: {
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
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
  content: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
  },
  notice: {
    color: colors.inkMuted,
    fontSize: 13,
    lineHeight: 20,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  fieldRow: { flexDirection: 'row', gap: spacing.md },
  field: { flex: 1, gap: spacing.xs },
  label: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.ink,
    paddingHorizontal: spacing.md,
  },
  locateButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  locateText: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  coordinateLabel: { textAlign: 'center', color: colors.inkMuted, fontSize: 12 },
  error: { color: colors.danger, fontSize: 12, lineHeight: 18 },
  confirmButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  disabled: { opacity: 0.65 },
  confirmText: { color: colors.surface, fontSize: 15, fontWeight: '900' },
});
