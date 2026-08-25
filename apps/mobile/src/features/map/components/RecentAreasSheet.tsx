import { Clock3, MapPin, Pin, PinOff, X } from 'lucide-react-native';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheetModal } from '@/components/ui';
import { colors, spacing } from '@/theme';

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
  return (
    <BottomSheetModal
      accessibilityLabel="Đóng khu vực gần đây"
      maxHeightRatio={0.72}
      minHeight={380}
      visible={visible}
      onClose={onClose}
    >
      <View className="flex-row items-center justify-between px-4 pb-4">
        <View className="flex-1 pr-3">
          <Text className="text-xl font-black text-ink">Khu vực gần đây</Text>
          <Text className="mt-0.5 text-xs text-muted">
            Chỉ lưu tối đa 8 tâm đã làm tròn trên thiết bị
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Đóng"
          className="h-11 w-11 items-center justify-center rounded-full bg-canvas active:opacity-70"
          onPress={onClose}
        >
          <X color={colors.inkMuted} size={20} />
        </Pressable>
      </View>

      {isLoading ? (
        <View className="min-h-[160px] items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}
      {error ? <Text className="px-4 text-xs text-danger">{error}</Text> : null}

      {!isLoading ? (
        <FlatList
          className="min-h-0 flex-1"
          data={areas}
          keyExtractor={(area) => area.id}
          contentContainerStyle={areas.length === 0 ? styles.emptyList : styles.list}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center p-6">
              <Clock3 color={colors.inkMuted} size={28} />
              <Text className="mt-3 text-base font-black text-ink">Chưa có khu vực gần đây</Text>
              <Text className="mt-1 text-[13px] text-muted">
                Kéo bản đồ để lưu khu vực đầu tiên.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="flex-row items-center border-t border-border py-3">
              <Pressable
                className="flex-1 flex-row items-center gap-3 active:opacity-70"
                onPress={() => onSelect(item)}
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-canvas">
                  <MapPin color={colors.primary} size={19} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-extrabold text-ink">{item.name}</Text>
                  <Text className="mt-0.5 text-[11px] text-muted">
                    Zoom {item.zoom.toFixed(1)} · tâm đã làm tròn 0,01°
                  </Text>
                </View>
              </Pressable>
              <Pressable
                accessibilityLabel={item.pinned ? 'Bỏ ghim khu vực' : 'Ghim khu vực'}
                className="h-11 w-11 items-center justify-center rounded-full active:opacity-60"
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
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  emptyList: { flexGrow: 1 },
});
