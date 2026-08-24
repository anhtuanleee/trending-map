import type { ReportDetail } from '@trending-map/contracts';
import { AlertTriangle, MapPin, X } from 'lucide-react-native';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StatusBadge } from '@/components/atoms';
import { colors, radius, spacing } from '@/theme';

const radiusOptions = [
  { label: 'Gần nhất', radiusKm: 1 },
  { label: 'Quanh đây', radiusKm: 5 },
  { label: 'Khu vực rộng', radiusKm: 15 },
] as const;

type NearbyReportsSheetProps = {
  visible: boolean;
  modeLabel: string;
  reports: ReportDetail[];
  radiusKm: number;
  isLoading: boolean;
  isError: boolean;
  onRadiusChange: (radiusKm: number) => void;
  onRetry: () => void;
  onSelect: (report: ReportDetail) => void;
  onClose: () => void;
};

function formatDistance(distanceMeters: number | null | undefined) {
  if (distanceMeters == null) return 'Chưa rõ khoảng cách';
  if (distanceMeters < 1_000) return `${Math.max(1, Math.round(distanceMeters))} m`;
  return `${(distanceMeters / 1_000).toFixed(distanceMeters < 10_000 ? 1 : 0)} km`;
}

export function NearbyReportsSheet({
  visible,
  modeLabel,
  reports,
  radiusKm,
  isLoading,
  isError,
  onRadiusChange,
  onRetry,
  onSelect,
  onClose,
}: NearbyReportsSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <Pressable
        accessibilityLabel="Đóng danh sách gần đây"
        style={styles.overlay}
        onPress={onClose}
      >
        <Pressable
          accessibilityViewIsModal
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{modeLabel}</Text>
              <Text style={styles.subtitle}>{reports.length} báo cáo phù hợp</Text>
            </View>
            <Pressable accessibilityLabel="Đóng" style={styles.closeButton} onPress={onClose}>
              <X color={colors.inkMuted} size={20} />
            </Pressable>
          </View>

          <View style={styles.radiusRow}>
            {radiusOptions.map((option) => (
              <Pressable
                key={option.radiusKm}
                style={[styles.radiusChip, radiusKm === option.radiusKm && styles.radiusChipActive]}
                onPress={() => onRadiusChange(option.radiusKm)}
              >
                <Text
                  style={[
                    styles.radiusText,
                    radiusKm === option.radiusKm && styles.radiusTextActive,
                  ]}
                >
                  {option.label} · {option.radiusKm} km
                </Text>
              </Pressable>
            ))}
          </View>

          {isLoading ? (
            <View style={styles.state}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.stateText}>Đang tìm báo cáo gần khu vực này…</Text>
            </View>
          ) : null}

          {isError ? (
            <Pressable style={styles.state} onPress={onRetry}>
              <AlertTriangle color={colors.danger} size={20} />
              <Text style={styles.errorText}>Không thể tải danh sách.</Text>
              <Text style={styles.retryText}>Thử lại</Text>
            </Pressable>
          ) : null}

          {!isLoading && !isError ? (
            <FlatList
              data={reports}
              keyExtractor={(report) => report.id}
              contentContainerStyle={reports.length === 0 ? styles.emptyList : styles.list}
              ListEmptyComponent={
                <Text style={styles.stateText}>Chưa có báo cáo trong bán kính đã chọn.</Text>
              }
              renderItem={({ item }) => (
                <Pressable style={styles.reportRow} onPress={() => onSelect(item)}>
                  <View style={styles.reportIcon}>
                    <MapPin color={colors.primary} size={19} />
                  </View>
                  <View style={styles.reportCopy}>
                    <View style={styles.reportTopRow}>
                      <Text style={styles.category}>{item.categoryName}</Text>
                      <Text style={styles.distance}>{formatDistance(item.distanceMeters)}</Text>
                    </View>
                    <Text numberOfLines={2} style={styles.reportTitle}>
                      {item.title}
                    </Text>
                    <StatusBadge status={item.verificationStatus} />
                  </View>
                </Pressable>
              )}
            />
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(16,35,31,0.38)' },
  sheet: {
    maxHeight: '78%',
    minHeight: 420,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  title: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  subtitle: { marginTop: 3, color: colors.inkMuted, fontSize: 12 },
  closeButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: colors.canvas,
  },
  radiusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  radiusChip: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xs,
  },
  radiusChipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  radiusText: { textAlign: 'center', color: colors.ink, fontSize: 11, fontWeight: '800' },
  radiusTextActive: { color: colors.surface },
  state: {
    minHeight: 150,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  stateText: { textAlign: 'center', color: colors.inkMuted, fontSize: 13 },
  errorText: { color: colors.danger, fontSize: 13 },
  retryText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  emptyList: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  reportRow: {
    flexDirection: 'row',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.lg,
  },
  reportIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.canvas,
  },
  reportCopy: { flex: 1, alignItems: 'flex-start' },
  reportTopRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  category: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  distance: { color: colors.inkMuted, fontSize: 11, fontWeight: '700' },
  reportTitle: { marginVertical: spacing.xs, color: colors.ink, fontSize: 15, fontWeight: '800' },
});
