export const appConfig = {
  name: 'Trending Map',
  scheme: 'trendingmap',
  oauthCallbackUrl: 'trendingmap://auth/callback',
  storageKeys: {
    recentAreas: 'trending-map.recent-areas.v2',
    legacyRecentAreas: 'machpho.recent-areas.v1',
  },
} as const;
