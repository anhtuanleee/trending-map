import { Redirect, useRouter } from 'expo-router';
import { AlertCircle } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { safeReturnTo } from '@/lib/navigation';
import { colors, spacing } from '@/theme';

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
      className="flex-1 items-center justify-center bg-canvas px-6"
      style={{ paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }}
    >
      <View
        className={`h-16 w-16 items-center justify-center rounded-full ${failed ? 'bg-danger-soft' : 'bg-primary-soft'}`}
      >
        {failed ? (
          <AlertCircle color={colors.danger} size={30} />
        ) : (
          <ActivityIndicator color={colors.primary} size="large" />
        )}
      </View>
      <Text className="mt-6 text-center text-[26px] font-black text-ink">
        {failed ? 'Không thể đăng nhập' : 'Đang hoàn tất đăng nhập'}
      </Text>
      <Text className="mt-3 max-w-[340px] text-center text-[15px] leading-[23px] text-muted">
        {failed
          ? (oauthError ?? 'Google OAuth không trả về session hợp lệ.')
          : 'Trending Map đang xác minh session Google và đưa mày về thao tác trước đó.'}
      </Text>
      {failed ? (
        <Pressable
          className="mt-6 min-h-[52px] items-center justify-center rounded-md bg-primary px-6 active:bg-primary-pressed"
          onPress={() => {
            resetOAuthError();
            router.replace({ pathname: '/auth', params: { returnTo: returnPath } });
          }}
        >
          <Text className="text-[15px] font-black text-white">Thử đăng nhập lại</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
