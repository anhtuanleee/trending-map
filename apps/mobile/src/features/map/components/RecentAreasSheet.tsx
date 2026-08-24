import { Clock3, MapPin, Pin, PinOff, X } from 'lucide-react-native';
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

import { colors, radius, spacing } from '@/theme';

import type { RecentArea } from '../data/recent-areas.repository';

type RecentAreasSheetProps = {
  visible: boolean;
  areas: RecentArea[];
  isLoading: boolean;
  error: string | null;
  onSelect: (area: RecentArea) => void;
  onTogglePin: (id: string) => void;
  onClose: () => void;
};

export function RecentAreasSheet({
  visible,
  areas,
  isLoading,
  error,
  onSelect,
  onTogglePin,
  onClose,
}: RecentAreasSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <Pressable accessibilityLabel="Đóng khu vực gần đây" style={styles.overlay} onPress={onClose}>
        <Pressable
          accessibilityViewIsModal
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Khu vực gần đây</Text>
              <Text style={styles.subtitle}>Chỉ lưu tối đa 8 tâm đã làm tròn trên thiết bị</Text>
            </View>
            <Pressable accessibilityLabel="Đóng" style={styles.closeButton} onPress={onClose}>
              <X color={colors.inkMuted} size={20} />
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.state}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {!isLoading ? (
            <FlatList
              data={areas}
              keyExtractor={(area) => area.id}
              contentContainerStyle={areas.length === 0 ? styles.emptyList : styles.list}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Clock3 color={colors.inkMuted} size={28} />
                  <Text style={styles.emptyTitle}>Chưa có khu vực gần đây</Text>
                  <Text style={styles.emptyText}>Kéo bản đồ để lưu khu vực đầu tiên.</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.areaRow}>
                  <Pressable style={styles.areaMain} onPress={() => onSelect(item)}>
                    <View style={styles.areaIcon}>
                      <MapPin color={colors.primary} size={19} />
                    </View>
                    <View style={styles.areaCopy}>
                      <Text style={styles.areaName}>{item.name}</Text>
                      <Text style={styles.areaMeta}>
                        Zoom {item.zoom.toFixed(1)} · tâm đã làm tròn 0,01°
                      </Text>
                    </View>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={item.pinned ? 'Bỏ ghim khu vực' : 'Ghim khu vực'}
                    style={styles.pinButton}
                    onPress={() => onTogglePin(item.id)}
                  >
                    {item.pinned ? (
                      <PinOff color={colors.primary} size={19} />
                    ) : (
                      <Pin color={colors.inkMuted} size={19} />
                    )}
                  </Pressable>
                </View>
              )}
            />
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  sheet: {
    maxHeight: '72%',
    minHeight: 380,
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
    paddingBottom: spacing.lg,
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
  state: { minHeight: 160, alignItems: 'center', justifyContent: 'center' },
  error: { paddingHorizontal: spacing.lg, color: colors.danger, fontSize: 12 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  emptyList: { flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyTitle: { marginTop: spacing.md, color: colors.ink, fontSize: 16, fontWeight: '900' },
  emptyText: { marginTop: spacing.xs, color: colors.inkMuted, fontSize: 13 },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.md,
  },
  areaMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  areaIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.canvas,
  },
  areaCopy: { flex: 1 },
  areaName: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  areaMeta: { marginTop: 3, color: colors.inkMuted, fontSize: 11 },
  pinButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
});
