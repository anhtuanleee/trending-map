import type { MapItem } from '@trending-map/contracts';

import type { MapViewportChange } from '../model/map-viewport';

export type CommunityMapCameraRef = {
  easeTo: (options: {
    center: [longitude: number, latitude: number];
    zoom: number;
    duration: number;
  }) => void;
};

export type CommunityMapSurfaceProps = {
  reports: MapItem[];
  followingUser: boolean;
  showsUserLocation: boolean;
  userCoordinate: [longitude: number, latitude: number] | null;
  onReportSelect: (report: MapItem) => void;
  onTrackingChange: (isTracking: boolean) => void;
  onViewportChange: (change: MapViewportChange) => void;
};
