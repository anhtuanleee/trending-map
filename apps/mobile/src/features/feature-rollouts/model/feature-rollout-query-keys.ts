export const featureRolloutQueryKeys = {
  all: ['feature-rollouts'] as const,
  current: (audienceKey: string) =>
    [...featureRolloutQueryKeys.all, 'current', audienceKey] as const,
};
