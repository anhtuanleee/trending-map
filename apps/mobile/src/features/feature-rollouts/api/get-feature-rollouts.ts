import {
  featureRolloutsSchema,
  type FeatureRollout,
  type FeatureRolloutKey,
} from '@trending-map/contracts';

import { supabase } from '@/lib/supabase/client';

const rolloutKeys: FeatureRolloutKey[] = [
  'live_incident_timeline',
  'photo_evidence_upload',
  'followed_area_push_alerts',
  'duplicate_report_merge',
  'local_pulse_feed',
  'event_save_reminder_share',
  'official_data_layers',
  'contributor_reputation',
];

export const disabledFeatureRollouts: FeatureRollout[] = rolloutKeys.map((key) => ({
  key,
  enabled: false,
  config: {},
}));

export async function getFeatureRollouts(): Promise<FeatureRollout[]> {
  if (!supabase) return disabledFeatureRollouts;

  const { data, error } = await supabase.rpc('get_feature_rollouts');
  if (error) throw error;

  return featureRolloutsSchema.parse(
    (data ?? []).map((row: { feature_key: string; enabled: boolean; rollout_config: unknown }) => ({
      key: row.feature_key,
      enabled: row.enabled,
      config: row.rollout_config ?? {},
    })),
  );
}
