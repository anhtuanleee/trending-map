import { useRouter } from 'expo-router';
import { ChevronRight, Crown } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { subscriptionConfig } from '@/config';
import { colors } from '@/theme';

import { useSubscription } from '../hooks/useSubscription';

export function SubscriptionAccountEntry() {
  const router = useRouter();
  const { tier } = useSubscription();

  if (!subscriptionConfig.enabled) return null;

  return (
    <View>
      <Text className="mb-2 mt-4 text-[11px] font-black text-primary">GÓI ĐĂNG KÝ</Text>
      <Pressable
        className="min-h-[84px] flex-row items-center gap-3 rounded-lg bg-surface px-4 active:bg-primary-soft"
        onPress={() => router.push('/subscription')}
      >
        <View className="h-11 w-11 items-center justify-center rounded-md bg-primary-soft">
          <Crown color={colors.primary} size={21} />
        </View>
        <View className="flex-1">
          <Text className="text-[15px] font-black text-ink">
            {tier === 'plus' ? 'Trending Map Plus' : 'Trending Map Free'}
          </Text>
          <Text className="mt-1 text-xs leading-[17px] text-muted">
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
