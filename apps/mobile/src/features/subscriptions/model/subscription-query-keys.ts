export const subscriptionQueryKeys = {
  all: ['subscription-entitlement'] as const,
  current: (userId: string) => [...subscriptionQueryKeys.all, userId] as const,
};
