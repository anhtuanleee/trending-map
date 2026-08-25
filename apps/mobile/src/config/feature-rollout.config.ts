import { featureRolloutKeySchema, type FeatureRolloutKey } from '@trending-map/contracts';

function featureKeys(value: string | undefined): FeatureRolloutKey[] {
  if (!value?.trim()) return [];

  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item): item is FeatureRolloutKey => featureRolloutKeySchema.safeParse(item).success);
}

export const featureRolloutConfig = {
  demoPreviewKeys: featureKeys(process.env.EXPO_PUBLIC_DEMO_FEATURE_PREVIEW_KEYS),
} as const;
