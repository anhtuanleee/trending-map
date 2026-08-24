import type { MapItem } from '@trending-map/contracts';

const severityRank: Record<MapItem['severity'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

const verificationRank: Record<MapItem['verificationStatus'], number> = {
  official_verified: 0,
  community_verified: 1,
  unverified: 2,
  disputed: 3,
};

export function sortNearbyReports(left: MapItem, right: MapItem) {
  return (
    severityRank[left.severity] - severityRank[right.severity] ||
    (left.distanceMeters ?? Number.POSITIVE_INFINITY) -
      (right.distanceMeters ?? Number.POSITIVE_INFINITY) ||
    Date.parse(right.startsAt) - Date.parse(left.startsAt) ||
    verificationRank[left.verificationStatus] - verificationRank[right.verificationStatus]
  );
}
