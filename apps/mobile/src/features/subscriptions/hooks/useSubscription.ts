import { useQuery } from '@tanstack/react-query';

import { subscriptionConfig } from '@/config';
import { useAuth } from '@/features/auth';

import { subscriptionBillingGateway } from '../api/billing.gateway';
import {
  freeSubscriptionEntitlement,
  getSubscriptionEntitlement,
} from '../api/get-subscription-entitlement';
import {
  effectiveSubscriptionTier,
  subscriptionFeatureValue,
  subscriptionPlanLimits,
} from '../domain/subscription-access';
import { subscriptionPlans } from '../model/subscription-plans';
import { subscriptionQueryKeys } from '../model/subscription-query-keys';

export function useSubscription() {
  const { user } = useAuth();
  const entitlementQuery = useQuery({
    queryKey: subscriptionQueryKeys.current(user?.id ?? 'guest'),
    queryFn: getSubscriptionEntitlement,
    enabled: subscriptionConfig.enabled && Boolean(user),
    placeholderData: freeSubscriptionEntitlement,
    staleTime: 60_000,
  });
  const entitlement = entitlementQuery.data ?? freeSubscriptionEntitlement;
  const tier = effectiveSubscriptionTier(entitlement);

  return {
    entitlement,
    entitlementQuery,
    tier,
    plan: subscriptionPlans[tier],
    limits: subscriptionPlanLimits(entitlement),
    billingAvailable:
      subscriptionConfig.enabled &&
      subscriptionConfig.paywallEnabled &&
      subscriptionConfig.billingEnabled &&
      subscriptionBillingGateway.configured,
  };
}

export function useSubscriptionAccess(feature: Parameters<typeof subscriptionFeatureValue>[1]) {
  const subscription = useSubscription();
  const rolloutEnabled = subscriptionConfig.enabledFeatureKeys.includes(feature);
  const value = subscriptionFeatureValue(subscription.limits, feature);
  const allowed = rolloutEnabled && (typeof value === 'boolean' ? value : value > 0);

  return {
    ...subscription,
    feature,
    rolloutEnabled,
    value,
    allowed,
    requiresUpgrade: rolloutEnabled && !allowed && subscription.tier === 'free',
  };
}
