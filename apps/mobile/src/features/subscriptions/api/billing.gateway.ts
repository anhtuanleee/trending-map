export type SubscriptionBillingGateway = {
  configured: boolean;
  purchase: (productId: string) => Promise<void>;
  restore: () => Promise<void>;
};

function unavailable(): never {
  throw new Error('Subscription billing chưa được cấu hình.');
}

export const subscriptionBillingGateway: SubscriptionBillingGateway = {
  configured: false,
  purchase: async () => unavailable(),
  restore: async () => unavailable(),
};
