export const featureRolloutQueryKeys = {
  all: ['feature-rollouts'] as const,
  current: () => [...featureRolloutQueryKeys.all, 'current'] as const,
};
