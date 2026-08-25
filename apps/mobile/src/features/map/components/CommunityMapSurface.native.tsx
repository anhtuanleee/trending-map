import {
  Camera,
  Map,
  UserLocation,
  type CameraRef as MapLibreCameraRef,
  type TrackUserLocationChangeEvent,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import type { NativeSyntheticEvent } from 'react-native';
import { StyleSheet } from 'react-native';

import { mapConfig } from '@/config';

import { CommunityReportsLayer } from './CommunityReportsLayer';
import type { CommunityMapCameraRef, CommunityMapSurfaceProps } from './CommunityMapSurface.types';

export const CommunityMapSurface = forwardRef<CommunityMapCameraRef, CommunityMapSurfaceProps>(
  function CommunityMapSurface(
    {
      reports,
      followingUser,
      showsUserLocation,
      onReportSelect,
      onTrackingChange,
      onViewportChange,
    },
    ref,
  ) {
    const cameraRef = useRef<MapLibreCameraRef>(null);

    useImperativeHandle(
      ref,
      () => ({
        easeTo: (options) => cameraRef.current?.easeTo(options),
      }),
      [],
    );

    const handleRegionDidChange = (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
      const { bounds, center, zoom, userInteraction } = event.nativeEvent;
      onViewportChange({ bounds, center, zoom, userInteraction });
    };

    const handleTrackingChange = (event: NativeSyntheticEvent<TrackUserLocationChangeEvent>) => {
      onTrackingChange(event.nativeEvent.trackUserLocation !== null);
    };

    return (
      <Map
        style={styles.map}
        mapStyle={mapConfig.styleUrl}
        compass={false}
        onRegionDidChange={handleRegionDidChange}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{ center: mapConfig.defaultCenter, zoom: mapConfig.defaultZoom }}
          minZoom={mapConfig.minimumZoom}
          trackUserLocation={followingUser ? 'default' : undefined}
          onTrackUserLocationChange={handleTrackingChange}
        />
        {showsUserLocation ? <UserLocation animated accuracy heading minDisplacement={10} /> : null}
        <CommunityReportsLayer reports={reports} onSelect={onReportSelect} />
      </Map>
    );
  },
);

const styles = StyleSheet.create({ map: { flex: 1 } });
