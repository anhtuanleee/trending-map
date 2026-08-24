import { useRouter } from 'expo-router';
import { ChevronRight, Crown } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { subscriptionConfig } from '@/config';
import { colors, radius, spacing } from '@/theme';

import { useSubscription } from '../hooks/useSubscription';

export function SubscriptionAccountEntry() {
  const router = useRouter();
  const { tier } = useSubscription();

  if (!subscriptionConfig.enabled) return null;

  return (
    <View>
      <Text style={styles.sectionLabel}>GÓI ĐĂNG KÝ</Text>
      <Pressable style={styles.card} onPress={() => router.push('/subscription')}>
        <View style={styles.icon}>
          <Crown color={colors.primary} size={21} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>
            {tier === 'plus' ? 'Trending Map Plus' : 'Trending Map Free'}
          </Text>
          <Text style={styles.meta}>
            {tier === 'plus'
              ? 'Đang mở các tiện ích Plus khả dụng.'
              : subscriptionConfig.paywallEnabled
                ? 'Xem tiện ích cảnh báo và khu vực nâng cao.'
                : 'Subscription foundation đang ở chế độ xem trước.'}
          </Text>
        </View>
        <ChevronRight color={colors.inkMuted} size={19} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
  },
  card: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  icon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  copy: { flex: 1 },
  title: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  meta: { marginTop: spacing.xs, color: colors.inkMuted, fontSize: 12, lineHeight: 17 },
});
