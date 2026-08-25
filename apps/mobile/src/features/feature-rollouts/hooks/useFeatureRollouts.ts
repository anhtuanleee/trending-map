import { useQuery } from '@tanstack/react-query';
import type { FeatureRolloutKey } from '@trending-map/contracts';

import { featureRolloutConfig } from '@/config';
import { isDemoMode } from '@/lib/supabase/client';

import { disabledFeatureRollouts, getFeatureRollouts } from '../api/get-feature-rollouts';
import { featureRolloutQueryKeys } from '../model/feature-rollout-query-keys';

export function useFeatureRollouts() {
  return useQuery({
    queryKey: featureRolloutQueryKeys.current(),
    queryFn: getFeatureRollouts,
    placeholderData: disabledFeatureRollouts,
    staleTime: 5 * 60_000,
  });
}

export function useFeatureRollout(key: FeatureRolloutKey) {
  const query = useFeatureRollouts();
  const rollout = query.data?.find((item) => item.key === key);
  const demoPreviewEnabled = isDemoMode && featureRolloutConfig.demoPreviewKeys.includes(key);

  return {
    ...query,
    enabled: demoPreviewEnabled || (rollout?.enabled ?? false),
    config: rollout?.config ?? {},
  };
}
