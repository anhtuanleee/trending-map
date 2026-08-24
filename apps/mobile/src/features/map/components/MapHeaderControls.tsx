import { Bell, History, Search, SlidersHorizontal, UserRound } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { appConfig, mapCategoryFilters } from '@/config';
import { colors, radius, spacing } from '@/theme';

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
  return (
    <>
      <View style={styles.header}>
        <View style={styles.brandBlock}>
          <Text style={styles.brand}>{appConfig.name}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable accessibilityLabel="Thông báo" style={styles.iconButton}>
            <Bell color={colors.ink} size={20} />
          </Pressable>
          <Pressable
            accessibilityLabel="Khu vực gần đây"
            style={styles.iconButton}
            onPress={onOpenRecentAreas}
          >
            <History color={hasRecentAreas ? colors.primary : colors.ink} size={20} />
          </Pressable>
          <Pressable
            accessibilityLabel="Tài khoản"
            style={styles.iconButton}
            onPress={onOpenAccount}
          >
            <UserRound color={isAuthenticated ? colors.primary : colors.ink} size={20} />
            {isAuthenticated ? <View style={styles.accountDot} /> : null}
          </Pressable>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Search color={colors.inkMuted} size={19} />
        <Text style={styles.searchText}>Tìm khu vực hoặc sự kiện</Text>
        <SlidersHorizontal color={colors.ink} size={19} />
      </View>

      <View style={styles.chips}>
        {mapCategoryFilters.map((filter, index) => (
          <Pressable
            key={filter.label}
            style={[styles.chip, index === activeFilterIndex && styles.chipActive]}
            onPress={() => onFilterChange(index)}
          >
            <Text style={[styles.chipText, index === activeFilterIndex && styles.chipTextActive]}>
              {filter.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 58,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandBlock: {
    borderRadius: radius.md,
    backgroundColor: colors.mapOverlay,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  brand: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  subtitle: { marginTop: 2, color: colors.inkMuted, fontSize: 11 },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  accountDot: {
    position: 'absolute',
    right: 9,
    bottom: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.surface,
    backgroundColor: colors.primary,
  },
  searchBar: {
    position: 'absolute',
    top: 124,
    left: spacing.lg,
    right: spacing.lg,
    minHeight: 50,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  searchText: { flex: 1, color: colors.inkMuted, fontSize: 14 },
  chips: {
    position: 'absolute',
    top: 184,
    left: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: radius.pill,
    backgroundColor: colors.mapOverlay,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: { backgroundColor: colors.ink },
  chipText: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: colors.onPrimary },
});
