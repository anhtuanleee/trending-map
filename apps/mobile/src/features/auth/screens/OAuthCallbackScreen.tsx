import { Redirect, useRouter } from 'expo-router';
import { AlertCircle } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { safeReturnTo } from '@/lib/navigation';
import { colors, radius, spacing } from '@/theme';

import { useAuth } from '../providers/AuthProvider';

type Props = {
  returnTo: string;
};

export function OAuthCallbackScreen({ returnTo }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, oauthStatus, oauthError, resetOAuthError } = useAuth();
  const returnPath = safeReturnTo(returnTo);

  if (user) return <Redirect href={returnPath as never} />;

  const failed = oauthStatus === 'error';

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
      ]}
    >
      <View style={[styles.iconWrap, failed && styles.errorIconWrap]}>
        {failed ? (
          <AlertCircle color={colors.danger} size={30} />
        ) : (
          <ActivityIndicator color={colors.primary} size="large" />
        )}
      </View>
      <Text style={styles.title}>{failed ? 'Không thể đăng nhập' : 'Đang hoàn tất đăng nhập'}</Text>
      <Text style={styles.description}>
        {failed
          ? (oauthError ?? 'Google OAuth không trả về session hợp lệ.')
          : 'Trending Map đang xác minh session Google và đưa mày về thao tác trước đó.'}
      </Text>
      {failed ? (
        <Pressable
          style={styles.button}
          onPress={() => {
            resetOAuthError();
            router.replace({ pathname: '/auth', params: { returnTo: returnPath } });
          }}
        >
          <Text style={styles.buttonText}>Thử đăng nhập lại</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
  },
  errorIconWrap: { backgroundColor: colors.dangerSoft },
  title: { marginTop: spacing.xl, color: colors.ink, fontSize: 26, fontWeight: '900' },
  description: {
    maxWidth: 340,
    marginTop: spacing.md,
    color: colors.inkMuted,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
  },
  button: {
    minHeight: 52,
    marginTop: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
  },
  buttonText: { color: colors.surface, fontSize: 15, fontWeight: '900' },
});
