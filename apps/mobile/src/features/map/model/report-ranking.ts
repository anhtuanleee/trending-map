import type { MapItem } from '@trending-map/contracts';

const severityRank: Record<MapItem['severity'], number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

const verificationRank: Record<MapItem['verificationStatus'], number> = {
  official_verified: 4,
  community_verified: 3,
  unverified: 2,
  disputed: 1,
};

export function sortNearbyReports(left: MapItem, right: MapItem) {
  return (
    severityRank[right.severity] - severityRank[left.severity] ||
    (left.distanceMeters ?? Number.POSITIVE_INFINITY) -
      (right.distanceMeters ?? Number.POSITIVE_INFINITY) ||
    Date.parse(right.startsAt) - Date.parse(left.startsAt) ||
    verificationRank[right.verificationStatus] - verificationRank[left.verificationStatus]
  );
}
