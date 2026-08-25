import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Crown, RefreshCw, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { subscriptionConfig } from '@/config';
import { useAuth } from '@/features/auth';
import { colors, spacing } from '@/theme';

import { subscriptionBillingGateway } from '../api/billing.gateway';
import { useSubscription } from '../hooks/useSubscription';
import { subscriptionFeatureCatalog, subscriptionPlans } from '../model/subscription-plans';

type BillingPeriod = 'monthly' | 'yearly';

const phaseLabels = {
  launch: 'Giai đoạn mở bán',
  next: 'Giai đoạn tiếp theo',
  later: 'Sau MVP',
} as const;

export function SubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const subscription = useSubscription();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('yearly');
  const [billingPending, setBillingPending] = useState(false);
  const plus = subscriptionPlans.plus;
  const founderPrice = subscriptionConfig.founderOfferEnabled
    ? plus.fallbackPrices.founderYearly
    : plus.fallbackPrices.yearly;

  const handlePurchase = async () => {
    if (!subscription.billingAvailable) return;

    const productId =
      billingPeriod === 'monthly'
        ? plus.productIds.monthly
        : subscriptionConfig.founderOfferEnabled
          ? plus.productIds.founderYearly
          : plus.productIds.yearly;
    setBillingPending(true);
    try {
      await subscriptionBillingGateway.purchase(productId);
      await subscription.entitlementQuery.refetch();
    } catch (caught) {
      Alert.alert(
        'Không thể đăng ký',
        caught instanceof Error ? caught.message : 'Hãy kiểm tra kết nối và thử lại.',
      );
    } finally {
      setBillingPending(false);
    }
  };

  const handleRestore = async () => {
    if (!subscription.billingAvailable) return;

    setBillingPending(true);
    try {
      await subscriptionBillingGateway.restore();
      await subscription.entitlementQuery.refetch();
    } catch (caught) {
      Alert.alert(
        'Không thể khôi phục',
        caught instanceof Error ? caught.message : 'Hãy kiểm tra kết nối và thử lại.',
      );
    } finally {
      setBillingPending(false);
    }
  };

  if (!subscriptionConfig.enabled) {
    return (
      <View className="flex-1 bg-canvas px-6" style={{ paddingTop: insets.top + spacing.md }}>
        <Pressable
          accessibilityLabel="Quay lại"
          className="h-11 w-11 items-center justify-center rounded-full bg-surface"
          onPress={() => router.back()}
        >
          <ArrowLeft color={colors.ink} size={22} />
        </Pressable>
        <View className="flex-1 justify-center pb-[90px]">
          <ShieldCheck color={colors.primary} size={36} />
          <Text className="mt-4 text-[26px] font-black text-ink">Subscription đang được tắt</Text>
          <Text className="mt-3 text-[15px] leading-[23px] text-muted">
            Foundation đã sẵn sàng nhưng chưa được expose cho người dùng.
          </Text>
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 bg-canvas px-6" style={{ paddingTop: insets.top + spacing.md }}>
        <Pressable
          accessibilityLabel="Quay lại"
          className="h-11 w-11 items-center justify-center rounded-full bg-surface"
          onPress={() => router.back()}
        >
          <ArrowLeft color={colors.ink} size={22} />
        </Pressable>
        <View className="flex-1 justify-center pb-[90px]">
          <Crown color={colors.primary} size={38} />
          <Text className="mt-4 text-[26px] font-black text-ink">Đăng nhập để quản lý gói</Text>
          <Text className="mt-3 text-[15px] leading-[23px] text-muted">
            Map và cảnh báo an toàn công cộng vẫn miễn phí. Tài khoản chỉ cần cho tiện ích cá nhân.
          </Text>
          <Button
            className="mt-6 min-h-[54px]"
            onPress={() =>
              router.push({ pathname: '/auth', params: { returnTo: '/subscription' } })
            }
          >
            Đăng nhập
          </Button>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-canvas"
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingBottom: insets.bottom + spacing.xxl,
      }}
    >
      <View className="flex-row items-center justify-between px-6">
        <Pressable
          accessibilityLabel="Quay lại"
          className="h-11 w-11 items-center justify-center rounded-full bg-surface"
          onPress={() => router.back()}
        >
          <ArrowLeft color={colors.ink} size={22} />
        </Pressable>
        <Text className="text-lg font-black text-ink">Gói đăng ký</Text>
        <View className="w-11" />
      </View>

      <View className="m-6 rounded-lg bg-primary-soft p-6">
        <View className="h-[58px] w-[58px] items-center justify-center rounded-lg bg-surface">
          <Crown color={colors.primary} size={30} />
        </View>
        <Text className="mt-4 text-[11px] font-black text-primary">TRENDING MAP PLUS</Text>
        <Text className="mt-2 text-[27px] font-black leading-[33px] text-ink">
          Theo dõi điều quan trọng với mày
        </Text>
        <Text className="mt-3 text-sm leading-[21px] text-muted">
          Plus bán khả năng cá nhân hóa và tự động hóa. Public map, report và cảnh báo critical
          chính thức không bị khóa.
        </Text>
        <View className="mt-4 flex-row justify-between border-t border-border pt-3">
          <Text className="text-xs text-muted">Gói hiện tại</Text>
          <Text className="text-xs font-black text-primary">{subscription.plan.name}</Text>
        </View>
      </View>

      {subscription.entitlementQuery.isError ? (
        <Pressable
          className="mx-6 mb-3 rounded-md bg-danger-soft p-3"
          onPress={() => void subscription.entitlementQuery.refetch()}
        >
          <Text className="text-[13px] font-black text-danger">
            Không thể đồng bộ trạng thái gói
          </Text>
          <Text className="mt-1 text-xs text-muted">
            Đang dùng quyền Free an toàn. Bấm để thử lại.
          </Text>
        </Pressable>
      ) : null}

      <View className="mx-6 flex-row gap-2 rounded-md bg-surface p-1">
        {(['monthly', 'yearly'] as const).map((period) => (
          <Pressable
            key={period}
            className={`min-h-11 flex-1 items-center justify-center rounded-sm ${billingPeriod === period ? 'bg-primary' : ''}`}
            onPress={() => setBillingPeriod(period)}
          >
            <Text
              className={`font-extrabold ${billingPeriod === period ? 'text-white' : 'text-muted'}`}
            >
              {period === 'monthly' ? 'Hàng tháng' : 'Hàng năm'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="mx-6 mt-3 items-center rounded-lg bg-surface p-6">
        <Text className="text-[31px] font-black text-ink">
          {billingPeriod === 'monthly' ? plus.fallbackPrices.monthly : founderPrice}
        </Text>
        <Text className="mt-1 text-xs text-muted">
          /{billingPeriod === 'monthly' ? 'tháng' : 'năm'} · giá hiển thị tạm thời
        </Text>
        {billingPeriod === 'yearly' ? (
          <Text className="mt-2 rounded-pill bg-primary-soft px-3 py-1 text-[11px] font-black text-primary">
            {subscriptionConfig.founderOfferEnabled
              ? 'Founder offer đang bật'
              : 'Tiết kiệm khoảng 28%'}
          </Text>
        ) : null}
      </View>

      <Text className="mx-6 mb-2 mt-8 text-lg font-black text-ink">Chi tiết quyền lợi</Text>
      <View className="mx-6 rounded-lg bg-surface px-4">
        {subscriptionFeatureCatalog.map((feature, index) => {
          const rolloutEnabled = subscriptionConfig.enabledFeatureKeys.includes(feature.key);
          return (
            <View
              key={feature.key}
              className={`flex-row gap-3 py-4 ${index > 0 ? 'border-t border-border' : ''}`}
            >
              <View
                className={`h-[30px] w-[30px] items-center justify-center rounded-full ${rolloutEnabled ? 'bg-primary-soft' : 'bg-canvas'}`}
              >
                <Check color={rolloutEnabled ? colors.primary : colors.inkMuted} size={16} />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="flex-1 text-sm font-black text-ink">{feature.title}</Text>
                  <Text
                    className={`text-[9px] font-extrabold ${rolloutEnabled ? 'text-primary' : 'text-muted'}`}
                  >
                    {rolloutEnabled ? 'Đã bật' : phaseLabels[feature.phase]}
                  </Text>
                </View>
                <Text className="mt-1 text-xs leading-[18px] text-muted">
                  {feature.description}
                </Text>
                <Text className="mt-2 text-[11px] font-black text-primary">
                  {feature.plusLabel}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <Pressable
        className={`mx-6 mt-6 min-h-14 flex-row items-center justify-center gap-2 rounded-md bg-primary ${!subscription.billingAvailable || billingPending || subscription.tier === 'plus' ? 'opacity-50' : 'active:bg-primary-pressed'}`}
        disabled={!subscription.billingAvailable || billingPending || subscription.tier === 'plus'}
        onPress={() => void handlePurchase()}
      >
        {billingPending ? <ActivityIndicator color={colors.surface} /> : null}
        <Text className="text-[15px] font-black text-white">
          {subscription.tier === 'plus'
            ? 'Plus đang hoạt động'
            : subscription.billingAvailable
              ? 'Đăng ký Trending Map Plus'
              : subscriptionConfig.paywallEnabled
                ? 'Billing chưa được kết nối'
                : 'Đăng ký sẽ mở sau'}
        </Text>
      </Pressable>

      <Pressable
        className={`mx-6 mt-2 min-h-12 flex-row items-center justify-center gap-2 ${!subscription.billingAvailable ? 'opacity-50' : 'active:opacity-70'}`}
        disabled={!subscription.billingAvailable || billingPending}
        onPress={() => void handleRestore()}
      >
        <RefreshCw color={colors.inkMuted} size={16} />
        <Text className="text-[13px] font-extrabold text-muted">Khôi phục giao dịch</Text>
      </Pressable>

      <Text className="mx-6 mt-3 text-center text-[11px] leading-[17px] text-muted">
        Store sẽ là nguồn giá chính thức. Subscription không tăng trust score, không mua
        verification và không ưu tiên report của người trả phí.
      </Text>
    </ScrollView>
  );
}
