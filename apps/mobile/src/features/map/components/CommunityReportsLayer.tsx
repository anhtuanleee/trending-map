import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import type { PressEventWithFeatures } from '@maplibre/maplibre-react-native';
import type { MapItem } from '@trending-map/contracts';
import type { FeatureCollection, Point } from 'geojson';
import { useMemo } from 'react';
import type { NativeSyntheticEvent } from 'react-native';

import { colors } from '@/theme';

type Props = {
  reports: MapItem[];
  selectedReportId?: string | null;
  onSelect: (report: MapItem) => void;
};

export function CommunityReportsLayer({ reports, selectedReportId, onSelect }: Props) {
  const collection = useMemo<FeatureCollection<Point>>(
    () => ({
      type: 'FeatureCollection',
      features: reports.map((report) => ({
        type: 'Feature',
        id: report.id,
        geometry: {
          type: 'Point',
          coordinates: [report.coordinate.longitude, report.coordinate.latitude],
        },
        properties: {
          id: report.id,
          severity: report.severity,
          verificationStatus: report.verificationStatus,
          selected: report.id === selectedReportId,
        },
      })),
    }),
    [reports, selectedReportId],
  );

  const handlePress = (event: NativeSyntheticEvent<PressEventWithFeatures>) => {
    const id = event.nativeEvent.features[0]?.properties?.id;
    if (typeof id !== 'string') return;
    const report = reports.find((item) => item.id === id);
    if (report) onSelect(report);
  };

  return (
    <GeoJSONSource
      id="community-reports"
      data={collection}
      cluster
      clusterRadius={44}
      onPress={handlePress}
    >
      <Layer
        id="report-clusters"
        type="circle"
        filter={['has', 'point_count']}
        paint={{
          'circle-color': colors.ink,
          'circle-radius': ['step', ['get', 'point_count'], 19, 10, 23, 30, 29],
          'circle-stroke-color': colors.accent,
          'circle-stroke-width': 3,
        }}
      />
      <Layer
        id="selected-report-halo"
        type="circle"
        filter={['all', ['!', ['has', 'point_count']], ['==', ['get', 'selected'], true]]}
        paint={{
          'circle-color': colors.primarySoft,
          'circle-radius': 19,
          'circle-stroke-color': colors.primary,
          'circle-stroke-width': 2,
        }}
      />
      <Layer
        id="report-points"
        type="circle"
        filter={['!', ['has', 'point_count']]}
        paint={{
          'circle-color': [
            'match',
            ['get', 'severity'],
            'critical',
            colors.critical,
            'high',
            colors.danger,
            'medium',
            colors.warning,
            colors.info,
          ],
          'circle-radius': 11,
          'circle-stroke-color': colors.surface,
          'circle-stroke-width': 4,
        }}
      />
    </GeoJSONSource>
  );
}
