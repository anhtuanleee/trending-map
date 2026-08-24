import { describe, expect, it } from 'vitest';

import { subscriptionEntitlementSchema, subscriptionFeatureKeySchema } from './subscription';

describe('subscription contracts', () => {
  it('accepts an active Plus entitlement without exposing store transaction data', () => {
    const entitlement = subscriptionEntitlementSchema.parse({
      tier: 'plus',
      status: 'active',
      source: 'play_store',
      productId: 'trending_map_plus_yearly',
      expiresAt: '2027-08-24T00:00:00.000Z',
      willRenew: true,
    });

    expect(entitlement.tier).toBe('plus');
    expect('originalTransactionId' in entitlement).toBe(false);
  });

  it('rejects undeclared premium feature keys', () => {
    expect(subscriptionFeatureKeySchema.safeParse('priority_verification').success).toBe(false);
  });
});
