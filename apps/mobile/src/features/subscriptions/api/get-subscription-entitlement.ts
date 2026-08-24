import {
  subscriptionEntitlementSchema,
  type SubscriptionEntitlement,
} from '@trending-map/contracts';

import { supabase } from '@/lib/supabase/client';

export const freeSubscriptionEntitlement: SubscriptionEntitlement = {
  tier: 'free',
  status: 'inactive',
  source: null,
  productId: null,
  expiresAt: null,
  willRenew: false,
};

export async function getSubscriptionEntitlement(): Promise<SubscriptionEntitlement> {
  if (!supabase) return freeSubscriptionEntitlement;

  const { data, error } = await supabase
    .from('subscription_entitlements')
    .select('tier,status,source,product_id,current_period_ends_at,will_renew')
    .maybeSingle();
  if (error) throw error;
  if (!data) return freeSubscriptionEntitlement;

  return subscriptionEntitlementSchema.parse({
    tier: data.tier,
    status: data.status,
    source: data.source,
    productId: data.product_id,
    expiresAt: data.current_period_ends_at,
    willRenew: data.will_renew,
  });
}
