import { useRouter } from 'expo-router';
import { ChevronRight, Crown } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SectionLabel } from '@/components/ui';
import { subscriptionConfig } from '@/config';
import { colors, radius, spacing } from '@/theme';

import { useSubscription } from '../hooks/useSubscription';

export function SubscriptionAccountEntry() {
  const router = useRouter();
  const { tier } = useSubscription();

  if (!subscriptionConfig.enabled) return null;

  return (
    <View>
      <SectionLabel>Gói đăng ký</SectionLabel>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        onPress={() => router.push('/subscription')}
      >
        <View style={styles.icon}>
          <Crown color={colors.accentInk} size={21} />
        </View>
        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>
              {tier === 'plus' ? 'Trending Map Plus' : 'Nâng cấp Trending Map'}
            </Text>
            <Text style={styles.planBadge}>{tier === 'plus' ? 'PLUS' : 'FREE'}</Text>
          </View>
          <Text style={styles.meta}>
            {tier === 'plus'
              ? 'Đang mở các tiện ích Plus khả dụng.'
              : subscriptionConfig.paywallEnabled
                ? 'Xem tiện ích cảnh báo và khu vực nâng cao.'
                : 'Subscription foundation đang ở chế độ xem trước.'}
          </Text>
        </View>
        <ChevronRight color={colors.accent} size={19} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 104,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    overflow: 'hidden',
    borderRadius: radius.xl,
    backgroundColor: colors.ink,
    paddingHorizontal: spacing.lg,
  },
  icon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
  },
  copy: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, color: colors.onPrimary, fontSize: 15, fontWeight: '800' },
  planBadge: {
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    color: colors.accentInk,
    paddingHorizontal: 7,
    paddingVertical: 3,
    fontSize: 9,
    fontWeight: '800',
  },
  meta: {
    marginTop: spacing.xs,
    color: colors.onPrimary,
    fontSize: 11,
    lineHeight: 16,
    opacity: 0.68,
  },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
});
