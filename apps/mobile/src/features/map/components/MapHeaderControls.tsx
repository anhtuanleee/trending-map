import { Bell, History, Search, SlidersHorizontal, UserRound } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { appConfig, mapCategoryFilters } from '@/config';
import { colors, spacing } from '@/theme';

type Props = {
  subtitle: string;
  activeFilterIndex: number;
  hasRecentAreas: boolean;
  isAuthenticated: boolean;
  onFilterChange: (index: number) => void;
  onOpenRecentAreas: () => void;
  onOpenAccount: () => void;
};

export function MapHeaderControls({
  subtitle,
  activeFilterIndex,
  hasRecentAreas,
  isAuthenticated,
  onFilterChange,
  onOpenRecentAreas,
  onOpenAccount,
}: Props) {
  const insets = useSafeAreaInsets();
  const headerTop = Math.max(insets.top + spacing.sm, spacing.xl);

  return (
    <>
      <View
        className="absolute left-4 right-4 flex-row items-center justify-between"
        style={{ top: headerTop }}
      >
        <View className="rounded-xl border border-white bg-map-overlay px-3 py-2 shadow-lg">
          <Text className="text-lg font-black text-ink">{appConfig.name}</Text>
          <Text className="mt-0.5 text-[11px] text-muted">{subtitle}</Text>
        </View>
        <View className="flex-row gap-2">
          <Pressable
            accessibilityLabel="Thông báo"
            className="h-11 w-11 items-center justify-center rounded-full border border-white bg-surface shadow-lg active:opacity-70"
          >
            <Bell color={colors.ink} size={20} />
          </Pressable>
          <Pressable
            accessibilityLabel="Khu vực gần đây"
            className="h-11 w-11 items-center justify-center rounded-full border border-white bg-surface shadow-lg active:opacity-70"
            onPress={onOpenRecentAreas}
          >
            <History color={hasRecentAreas ? colors.primary : colors.ink} size={20} />
          </Pressable>
          <Pressable
            accessibilityLabel="Tài khoản"
            className="relative h-11 w-11 items-center justify-center rounded-full border border-white bg-surface shadow-lg active:opacity-70"
            onPress={onOpenAccount}
          >
            <UserRound color={isAuthenticated ? colors.primary : colors.ink} size={20} />
            {isAuthenticated ? (
              <View className="absolute bottom-2 right-2 h-2 w-2 rounded-full border border-surface bg-primary" />
            ) : null}
          </Pressable>
        </View>
      </View>

      <View
        className="absolute left-4 right-4 min-h-[50px] flex-row items-center gap-2 rounded-xl border border-white bg-surface px-4 shadow-lg"
        style={{ top: headerTop + 66 }}
      >
        <Search color={colors.inkMuted} size={19} />
        <Text className="flex-1 text-sm text-muted">Tìm khu vực hoặc sự kiện</Text>
        <SlidersHorizontal color={colors.ink} size={19} />
      </View>

      <View className="absolute left-4 flex-row gap-2" style={{ top: headerTop + 126 }}>
        {mapCategoryFilters.map((filter, index) => (
          <Pressable
            key={filter.label}
            className={`rounded-full px-3 py-2 ${index === activeFilterIndex ? 'bg-ink' : 'bg-map-overlay'} active:opacity-70`}
            onPress={() => onFilterChange(index)}
          >
            <Text
              className={`text-xs font-bold ${index === activeFilterIndex ? 'text-white' : 'text-ink'}`}
            >
              {filter.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}
