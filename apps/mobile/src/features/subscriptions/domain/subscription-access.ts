import type {
  SubscriptionEntitlement,
  SubscriptionFeatureKey,
  SubscriptionTier,
} from '@trending-map/contracts';

import { subscriptionPlans, type SubscriptionPlanLimits } from '../model/subscription-plans';

const activeStatuses = new Set<SubscriptionEntitlement['status']>([
  'trialing',
  'active',
  'grace_period',
]);

export function effectiveSubscriptionTier(entitlement: SubscriptionEntitlement): SubscriptionTier {
  return entitlement.tier === 'plus' && activeStatuses.has(entitlement.status) ? 'plus' : 'free';
}

export function subscriptionPlanLimits(entitlement: SubscriptionEntitlement) {
  return subscriptionPlans[effectiveSubscriptionTier(entitlement)].limits;
}

export function subscriptionFeatureValue(
  limits: SubscriptionPlanLimits,
  feature: SubscriptionFeatureKey,
) {
  const values = {
    followed_areas: limits.followedAreas,
    custom_alerts: limits.customAlerts,
    alert_radius: limits.customAlertRadius,
    quiet_hours: limits.quietHours,
    route_watch: limits.routeWatches,
    report_history: limits.reportHistoryDays,
    saved_filters: limits.savedFilters,
    digests: limits.digests,
    ad_free: limits.adFree,
  } satisfies Record<SubscriptionFeatureKey, number | boolean>;

  return values[feature];
}
