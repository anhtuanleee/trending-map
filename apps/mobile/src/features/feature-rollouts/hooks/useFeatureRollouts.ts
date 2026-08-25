import { useQuery } from '@tanstack/react-query';
import type { FeatureRolloutKey } from '@trending-map/contracts';

import { featureRolloutConfig } from '@/config';
import { useAuth } from '@/features/auth';
import { isDemoMode } from '@/lib/supabase/client';

import { disabledFeatureRollouts, getFeatureRollouts } from '../api/get-feature-rollouts';
import { featureRolloutQueryKeys } from '../model/feature-rollout-query-keys';

export function useFeatureRollouts() {
  const { user, loading: authLoading } = useAuth();

  return useQuery({
    queryKey: featureRolloutQueryKeys.current(user?.id ?? 'guest'),
    queryFn: getFeatureRollouts,
    placeholderData: disabledFeatureRollouts,
    enabled: !authLoading,
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
