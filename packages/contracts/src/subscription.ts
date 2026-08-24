import { z } from 'zod';

export const subscriptionTierSchema = z.enum(['free', 'plus']);

export const subscriptionStatusSchema = z.enum([
  'inactive',
  'trialing',
  'active',
  'grace_period',
  'past_due',
  'expired',
  'revoked',
]);

export const subscriptionSourceSchema = z.enum(['app_store', 'play_store', 'web', 'manual']);

export const subscriptionFeatureKeySchema = z.enum([
  'followed_areas',
  'custom_alerts',
  'alert_radius',
  'quiet_hours',
  'route_watch',
  'report_history',
  'saved_filters',
  'digests',
  'ad_free',
]);

export const subscriptionEntitlementSchema = z.object({
  tier: subscriptionTierSchema,
  status: subscriptionStatusSchema,
  source: subscriptionSourceSchema.nullable(),
  productId: z.string().nullable(),
  expiresAt: z.string().datetime().nullable(),
  willRenew: z.boolean(),
});

export type SubscriptionTier = z.infer<typeof subscriptionTierSchema>;
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;
export type SubscriptionSource = z.infer<typeof subscriptionSourceSchema>;
export type SubscriptionFeatureKey = z.infer<typeof subscriptionFeatureKeySchema>;
export type SubscriptionEntitlement = z.infer<typeof subscriptionEntitlementSchema>;
