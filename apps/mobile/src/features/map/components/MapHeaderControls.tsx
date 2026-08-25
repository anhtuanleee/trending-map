import {
  Bell,
  CarFront,
  CloudRain,
  History,
  Music2,
  Search,
  SlidersHorizontal,
  Sparkles,
  UserRound,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@/components/ui';
import { appConfig, mapCategoryFilters } from '@/config';
import { colors, radius, spacing } from '@/theme';

const filterVisuals: Array<{ Icon: LucideIcon; color: string }> = [
  { Icon: Sparkles, color: colors.primary },
  { Icon: CarFront, color: colors.traffic },
  { Icon: CloudRain, color: colors.weather },
  { Icon: Music2, color: colors.event },
];

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
          <View style={styles.brandRow}>
            <View style={styles.liveDot} />
            <Text style={styles.brand}>{appConfig.name}</Text>
          </View>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View style={styles.headerActions}>
          <IconButton accessibilityLabel="Thông báo" elevated onPress={() => undefined}>
            <Bell color={colors.ink} size={20} />
          </IconButton>
          <IconButton
            accessibilityLabel="Khu vực gần đây"
            elevated
            selected={hasRecentAreas}
            onPress={onOpenRecentAreas}
          >
            <History color={hasRecentAreas ? colors.primary : colors.ink} size={20} />
          </IconButton>
          <IconButton
            accessibilityLabel="Tài khoản"
            elevated
            selected={isAuthenticated}
            onPress={onOpenAccount}
          >
            <UserRound color={isAuthenticated ? colors.primary : colors.ink} size={20} />
            {isAuthenticated ? <View style={styles.accountDot} /> : null}
          </IconButton>
        </View>
      </View>

      <View accessibilityRole="search" style={styles.searchBar}>
        <Search color={colors.inkMuted} size={19} />
        <Text style={styles.searchText}>Tìm khu vực hoặc sự kiện</Text>
        <View style={styles.filterButton}>
          <SlidersHorizontal color={colors.ink} size={18} />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroller}
        contentContainerStyle={styles.chips}
      >
        {mapCategoryFilters.map((filter, index) => {
          const visual = filterVisuals[index];
          const active = index === activeFilterIndex;
          return (
            <Pressable
              key={filter.label}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && styles.chipPressed,
              ]}
              onPress={() => onFilterChange(index)}
            >
              <visual.Icon color={active ? colors.onPrimary : visual.color} size={15} />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{filter.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryBright },
  brand: { color: colors.ink, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { marginTop: 3, color: colors.inkMuted, fontSize: 10, fontWeight: '600' },
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
    backgroundColor: colors.mapSurfaceStrong,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.lg,
    paddingRight: 6,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 7,
  },
  searchText: { flex: 1, color: colors.inkMuted, fontSize: 14 },
  filterButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  chipScroller: { position: 'absolute', top: 184, left: 0, right: 0 },
  chips: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.mapOverlay,
    paddingHorizontal: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  chipActive: { backgroundColor: colors.ink },
  chipPressed: { opacity: 0.8, transform: [{ scale: 0.97 }] },
  chipText: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: colors.onPrimary },
});
