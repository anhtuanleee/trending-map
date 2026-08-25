import { useRouter } from 'expo-router';
import { Check, Map, ShieldCheck } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

export function SignedOutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 justify-center bg-canvas px-6"
      style={{ paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }}
    >
      <View className="items-center">
        <View className="h-[68px] w-[68px] items-center justify-center rounded-full bg-primary">
          <Check color={colors.surface} size={32} />
        </View>
        <Text accessibilityRole="header" className="mt-6 text-3xl font-black text-ink">
          Đã đăng xuất
        </Text>
        <Text className="mt-3 max-w-[320px] text-center text-[15px] leading-[23px] text-muted">
          Mày vẫn có thể xem sự kiện, cảnh báo và tình trạng xung quanh với tư cách khách.
        </Text>
        <Pressable
          className="mt-8 min-h-[54px] self-stretch flex-row items-center justify-center gap-2 rounded-md bg-primary active:bg-primary-pressed"
          onPress={() => router.replace('/')}
        >
          <Map color={colors.surface} size={19} />
          <Text className="text-[15px] font-black text-white">Quay lại bản đồ</Text>
        </Pressable>
        <Pressable
          className="mt-3 min-h-[52px] self-stretch flex-row items-center justify-center gap-2 rounded-md border border-border bg-surface active:bg-canvas"
          onPress={() => router.replace({ pathname: '/auth', params: { returnTo: '/account' } })}
        >
          <ShieldCheck color={colors.ink} size={19} />
          <Text className="text-[15px] font-extrabold text-ink">Đăng nhập lại</Text>
        </Pressable>
      </View>
    </View>
  );
}
