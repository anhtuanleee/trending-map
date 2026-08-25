import { useQuery } from '@tanstack/react-query';
import type { FeatureRolloutKey } from '@trending-map/contracts';

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

  return {
    ...query,
    enabled: rollout?.enabled ?? false,
    config: rollout?.config ?? {},
  };
}
