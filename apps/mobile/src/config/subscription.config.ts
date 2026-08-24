import { subscriptionFeatureKeySchema, type SubscriptionFeatureKey } from '@trending-map/contracts';

function enabled(value: string | undefined) {
  return value?.trim().toLowerCase() === 'true';
}

function featureKeys(value: string | undefined): SubscriptionFeatureKey[] {
  if (!value?.trim()) return [];

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(
      (item): item is SubscriptionFeatureKey =>
        subscriptionFeatureKeySchema.safeParse(item).success,
    );
}

export const subscriptionConfig = {
  enabled: enabled(process.env.EXPO_PUBLIC_SUBSCRIPTIONS_ENABLED),
  paywallEnabled: enabled(process.env.EXPO_PUBLIC_SUBSCRIPTION_PAYWALL_ENABLED),
  billingEnabled: enabled(process.env.EXPO_PUBLIC_SUBSCRIPTION_BILLING_ENABLED),
  founderOfferEnabled: enabled(process.env.EXPO_PUBLIC_SUBSCRIPTION_FOUNDER_OFFER_ENABLED),
  enabledFeatureKeys: featureKeys(process.env.EXPO_PUBLIC_SUBSCRIPTION_ENABLED_FEATURES),
} as const;
