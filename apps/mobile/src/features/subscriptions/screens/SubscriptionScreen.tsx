import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Crown, RefreshCw, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { subscriptionConfig } from '@/config';
import { useAuth } from '@/features/auth';
import { colors, radius, spacing } from '@/theme';

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
      <View style={[styles.disabledScreen, { paddingTop: insets.top + spacing.md }]}>
        <Pressable accessibilityLabel="Quay lại" style={styles.back} onPress={() => router.back()}>
          <ArrowLeft color={colors.ink} size={22} />
        </Pressable>
        <View style={styles.centeredCopy}>
          <ShieldCheck color={colors.primary} size={36} />
          <Text style={styles.disabledTitle}>Subscription đang được tắt</Text>
          <Text style={styles.disabledDescription}>
            Foundation đã sẵn sàng nhưng chưa được expose cho người dùng.
          </Text>
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.disabledScreen, { paddingTop: insets.top + spacing.md }]}>
        <Pressable accessibilityLabel="Quay lại" style={styles.back} onPress={() => router.back()}>
          <ArrowLeft color={colors.ink} size={22} />
        </Pressable>
        <View style={styles.centeredCopy}>
          <Crown color={colors.primary} size={38} />
          <Text style={styles.disabledTitle}>Đăng nhập để quản lý gói</Text>
          <Text style={styles.disabledDescription}>
            Map và cảnh báo an toàn công cộng vẫn miễn phí. Tài khoản chỉ cần cho tiện ích cá nhân.
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() =>
              router.push({ pathname: '/auth', params: { returnTo: '/subscription' } })
            }
          >
            <Text style={styles.primaryButtonText}>Đăng nhập</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingBottom: insets.bottom + spacing.xxl,
      }}
    >
      <View style={styles.header}>
        <Pressable accessibilityLabel="Quay lại" style={styles.back} onPress={() => router.back()}>
          <ArrowLeft color={colors.ink} size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>Gói đăng ký</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Crown color={colors.primary} size={30} />
        </View>
        <Text style={styles.eyebrow}>TRENDING MAP PLUS</Text>
        <Text style={styles.heroTitle}>Theo dõi điều quan trọng với mày</Text>
        <Text style={styles.heroDescription}>
          Plus bán khả năng cá nhân hóa và tự động hóa. Public map, report và cảnh báo critical
          chính thức không bị khóa.
        </Text>
        <View style={styles.currentPlan}>
          <Text style={styles.currentPlanLabel}>Gói hiện tại</Text>
          <Text style={styles.currentPlanValue}>{subscription.plan.name}</Text>
        </View>
      </View>

      {subscription.entitlementQuery.isError ? (
        <Pressable
          style={styles.errorCard}
          onPress={() => void subscription.entitlementQuery.refetch()}
        >
          <Text style={styles.errorTitle}>Không thể đồng bộ trạng thái gói</Text>
          <Text style={styles.errorDescription}>Đang dùng quyền Free an toàn. Bấm để thử lại.</Text>
        </Pressable>
      ) : null}

      <View style={styles.periodRow}>
        {(['monthly', 'yearly'] as const).map((period) => (
          <Pressable
            key={period}
            style={[styles.periodButton, billingPeriod === period && styles.periodButtonActive]}
            onPress={() => setBillingPeriod(period)}
          >
            <Text
              style={[
                styles.periodButtonText,
                billingPeriod === period && styles.periodButtonTextActive,
              ]}
            >
              {period === 'monthly' ? 'Hàng tháng' : 'Hàng năm'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.priceCard}>
        <Text style={styles.price}>
          {billingPeriod === 'monthly' ? plus.fallbackPrices.monthly : founderPrice}
        </Text>
        <Text style={styles.pricePeriod}>
          /{billingPeriod === 'monthly' ? 'tháng' : 'năm'} · giá hiển thị tạm thời
        </Text>
        {billingPeriod === 'yearly' ? (
          <Text style={styles.saving}>
            {subscriptionConfig.founderOfferEnabled
              ? 'Founder offer đang bật'
              : 'Tiết kiệm khoảng 28%'}
          </Text>
        ) : null}
      </View>

      <Text style={styles.sectionTitle}>Chi tiết quyền lợi</Text>
      <View style={styles.featuresCard}>
        {subscriptionFeatureCatalog.map((feature, index) => {
          const rolloutEnabled = subscriptionConfig.enabledFeatureKeys.includes(feature.key);
          return (
            <View key={feature.key} style={[styles.featureRow, index > 0 && styles.featureBorder]}>
              <View style={[styles.checkIcon, !rolloutEnabled && styles.checkIconPlanned]}>
                <Check color={rolloutEnabled ? colors.primary : colors.inkMuted} size={16} />
              </View>
              <View style={styles.featureCopy}>
                <View style={styles.featureTitleRow}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={[styles.phase, rolloutEnabled && styles.phaseEnabled]}>
                    {rolloutEnabled ? 'Đã bật' : phaseLabels[feature.phase]}
                  </Text>
                </View>
                <Text style={styles.featureDescription}>{feature.description}</Text>
                <Text style={styles.featureLimit}>{feature.plusLabel}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <Pressable
        style={[
          styles.purchaseButton,
          (!subscription.billingAvailable || billingPending || subscription.tier === 'plus') &&
            styles.buttonDisabled,
        ]}
        disabled={!subscription.billingAvailable || billingPending || subscription.tier === 'plus'}
        onPress={() => void handlePurchase()}
      >
        {billingPending ? <ActivityIndicator color={colors.surface} /> : null}
        <Text style={styles.purchaseButtonText}>
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
        style={[styles.restoreButton, !subscription.billingAvailable && styles.buttonDisabled]}
        disabled={!subscription.billingAvailable || billingPending}
        onPress={() => void handleRestore()}
      >
        <RefreshCw color={colors.inkMuted} size={16} />
        <Text style={styles.restoreText}>Khôi phục giao dịch</Text>
      </Pressable>

      <Text style={styles.legal}>
        Store sẽ là nguồn giá chính thức. Subscription không tăng trust score, không mua
        verification và không ưu tiên report của người trả phí.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  disabledScreen: {
    flex: 1,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.xl,
  },
  centeredCopy: { flex: 1, justifyContent: 'center', paddingBottom: 90 },
  disabledTitle: { marginTop: spacing.lg, color: colors.ink, fontSize: 26, fontWeight: '900' },
  disabledDescription: {
    marginTop: spacing.md,
    color: colors.inkMuted,
    fontSize: 15,
    lineHeight: 23,
  },
  header: {
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  headerSpacer: { width: 44 },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.surface,
  },
  hero: {
    margin: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    padding: spacing.xl,
  },
  heroIcon: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  eyebrow: { marginTop: spacing.lg, color: colors.primary, fontSize: 11, fontWeight: '900' },
  heroTitle: {
    marginTop: spacing.sm,
    color: colors.ink,
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '900',
  },
  heroDescription: {
    marginTop: spacing.md,
    color: colors.inkMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  currentPlan: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  currentPlanLabel: { color: colors.inkMuted, fontSize: 12 },
  currentPlanValue: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  periodRow: {
    marginHorizontal: spacing.xl,
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.xs,
  },
  errorCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
  },
  errorTitle: { color: colors.danger, fontSize: 13, fontWeight: '900' },
  errorDescription: { marginTop: spacing.xs, color: colors.inkMuted, fontSize: 12 },
  periodButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  periodButtonActive: { backgroundColor: colors.primary },
  periodButtonText: { color: colors.inkMuted, fontWeight: '800' },
  periodButtonTextActive: { color: colors.surface },
  priceCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    alignItems: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.xl,
  },
  price: { color: colors.ink, fontSize: 31, fontWeight: '900' },
  pricePeriod: { marginTop: spacing.xs, color: colors.inkMuted, fontSize: 12 },
  saving: {
    marginTop: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    fontSize: 11,
    fontWeight: '900',
  },
  sectionTitle: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  featuresCard: {
    marginHorizontal: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  featureRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.lg },
  featureBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  checkIcon: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: colors.primarySoft,
  },
  checkIconPlanned: { backgroundColor: colors.canvas },
  featureCopy: { flex: 1 },
  featureTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  featureTitle: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '900' },
  phase: { color: colors.inkMuted, fontSize: 9, fontWeight: '800' },
  phaseEnabled: { color: colors.primary },
  featureDescription: {
    marginTop: spacing.xs,
    color: colors.inkMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  featureLimit: { marginTop: spacing.sm, color: colors.primary, fontSize: 11, fontWeight: '900' },
  purchaseButton: {
    minHeight: 56,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  purchaseButtonText: { color: colors.surface, fontSize: 15, fontWeight: '900' },
  primaryButton: {
    minHeight: 54,
    marginTop: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  primaryButtonText: { color: colors.surface, fontWeight: '900' },
  restoreButton: {
    minHeight: 48,
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  restoreText: { color: colors.inkMuted, fontSize: 13, fontWeight: '800' },
  buttonDisabled: { opacity: 0.5 },
  legal: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    color: colors.inkMuted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
  },
});
