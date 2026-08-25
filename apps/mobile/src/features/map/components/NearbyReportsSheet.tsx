import type { MapItem } from '@trending-map/contracts';
import { AlertTriangle, MapPin, X } from 'lucide-react-native';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheetModal, StatusBadge } from '@/components/ui';
import { nearbyRadiusOptions } from '@/config';
import { formatDistance } from '@/lib/format';
import { colors, spacing } from '@/theme';

type NearbyReportsSheetProps = {
  visible: boolean;
  modeLabel: string;
  reports: MapItem[];
  radiusKm: number;
  isLoading: boolean;
  isError: boolean;
  onRadiusChange: (radiusKm: number) => void;
  onRetry: () => void;
  onSelect: (report: MapItem) => void;
  onClose: () => void;
};

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
  return (
    <BottomSheetModal
      accessibilityLabel="Đóng danh sách gần đây"
      maxHeightRatio={0.78}
      minHeight={420}
      visible={visible}
      onClose={onClose}
    >
      <View className="flex-row items-center justify-between px-4">
        <View className="flex-1 pr-3">
          <Text className="text-xl font-black text-ink">{modeLabel}</Text>
          <Text className="mt-0.5 text-xs text-muted">{reports.length} báo cáo phù hợp</Text>
        </View>
        <Pressable
          accessibilityLabel="Đóng"
          className="h-11 w-11 items-center justify-center rounded-full bg-canvas active:opacity-70"
          onPress={onClose}
        >
          <X color={colors.inkMuted} size={20} />
        </Pressable>
      </View>

      <View className="flex-row gap-2 px-4 py-4">
        {nearbyRadiusOptions.map((option) => (
          <Pressable
            key={option.radiusKm}
            className={`min-h-11 flex-1 items-center justify-center rounded-xl border px-1 ${radiusKm === option.radiusKm ? 'border-primary bg-primary' : 'border-border'} active:opacity-70`}
            onPress={() => onRadiusChange(option.radiusKm)}
          >
            <Text
              className={`text-center text-[11px] font-extrabold ${radiusKm === option.radiusKm ? 'text-white' : 'text-ink'}`}
            >
              {option.label} · {option.radiusKm} km
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <View className="min-h-[150px] flex-row items-center justify-center gap-2 p-6">
          <ActivityIndicator color={colors.primary} />
          <Text className="text-center text-[13px] text-muted">
            Đang tìm báo cáo gần khu vực này…
          </Text>
        </View>
      ) : null}

      {isError ? (
        <Pressable
          className="min-h-[150px] flex-row items-center justify-center gap-2 p-6"
          onPress={onRetry}
        >
          <AlertTriangle color={colors.danger} size={20} />
          <Text className="text-[13px] text-danger">Không thể tải danh sách.</Text>
          <Text className="text-[13px] font-black text-primary">Thử lại</Text>
        </Pressable>
      ) : null}

      {!isLoading && !isError ? (
        <FlatList
          className="min-h-0 flex-1"
          data={reports}
          keyExtractor={(report) => report.id}
          contentContainerStyle={reports.length === 0 ? styles.emptyList : styles.list}
          ListEmptyComponent={
            <Text className="text-center text-[13px] text-muted">
              Chưa có báo cáo trong bán kính đã chọn.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              className="flex-row gap-3 border-t border-border py-4 active:opacity-70"
              onPress={() => onSelect(item)}
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-canvas">
                <MapPin color={colors.primary} size={19} />
              </View>
              <View className="flex-1 items-start">
                <View className="w-full flex-row justify-between gap-2">
                  <Text className="text-[11px] font-black text-primary">{item.categoryName}</Text>
                  <Text className="text-[11px] font-bold text-muted">
                    {formatDistance(item.distanceMeters)}
                  </Text>
                </View>
                <Text numberOfLines={2} className="my-1 text-[15px] font-extrabold text-ink">
                  {item.title}
                </Text>
                <StatusBadge status={item.verificationStatus} />
              </View>
            </Pressable>
          )}
        />
      ) : null}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  emptyList: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
});
