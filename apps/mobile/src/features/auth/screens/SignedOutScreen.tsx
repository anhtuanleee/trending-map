import { useRouter } from 'expo-router';
import { Check, Map, ShieldCheck } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/theme';

export function SignedOutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Check color={colors.accentInk} size={32} />
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          Đã đăng xuất
        </Text>
        <Text style={styles.description}>
          Mày vẫn có thể xem sự kiện, cảnh báo và tình trạng xung quanh với tư cách khách.
        </Text>
        <Pressable style={styles.primaryButton} onPress={() => router.replace('/')}>
          <Map color={colors.accentInk} size={19} />
          <Text style={styles.primaryButtonText}>Quay lại bản đồ</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.replace({ pathname: '/auth', params: { returnTo: '/account' } })}
        >
          <ShieldCheck color={colors.ink} size={19} />
          <Text style={styles.secondaryButtonText}>Đăng nhập lại</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.canvas,
    padding: spacing.xl,
  },
  content: { alignItems: 'center' },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  title: {
    marginTop: spacing.xl,
    color: colors.ink,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  description: {
    maxWidth: 320,
    marginTop: spacing.md,
    color: colors.inkMuted,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
  },
  primaryButton: {
    alignSelf: 'stretch',
    minHeight: 54,
    marginTop: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
  },
  primaryButtonText: { color: colors.accentInk, fontSize: 15, fontWeight: '800' },
  secondaryButton: {
    alignSelf: 'stretch',
    minHeight: 52,
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  secondaryButtonText: { color: colors.ink, fontSize: 15, fontWeight: '800' },
});
