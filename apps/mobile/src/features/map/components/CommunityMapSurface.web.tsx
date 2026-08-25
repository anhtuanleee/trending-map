import type { MapItem } from '@trending-map/contracts';
import type { FeatureCollection, Point } from 'geojson';
import maplibregl, { type GeoJSONSource, type MapLayerMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';

import { mapConfig } from '@/config';
import { colors } from '@/theme';

import type { CommunityMapCameraRef, CommunityMapSurfaceProps } from './CommunityMapSurface.types';

const sourceId = 'community-reports';
const clusterLayerId = 'report-clusters';
const clusterCountLayerId = 'report-cluster-count';
const pointLayerId = 'report-points';

function toFeatureCollection(reports: MapItem[]): FeatureCollection<Point> {
  return {
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
      },
    })),
  };
}

export const CommunityMapSurface = forwardRef<CommunityMapCameraRef, CommunityMapSurfaceProps>(
  function CommunityMapSurface(
    { reports, showsUserLocation, userCoordinate, onReportSelect, onViewportChange },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const markerRef = useRef<maplibregl.Marker | null>(null);
    const reportsRef = useRef(reports);
    const onReportSelectRef = useRef(onReportSelect);
    const onViewportChangeRef = useRef(onViewportChange);
    const programmaticMoveRef = useRef(false);
    const collection = useMemo(() => toFeatureCollection(reports), [reports]);

    reportsRef.current = reports;
    onReportSelectRef.current = onReportSelect;
    onViewportChangeRef.current = onViewportChange;

    useImperativeHandle(
      ref,
      () => ({
        easeTo: ({ center, zoom, duration }) => {
          programmaticMoveRef.current = true;
          mapRef.current?.easeTo({ center, zoom, duration });
        },
      }),
      [],
    );

    useEffect(() => {
      if (!containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: mapConfig.styleUrl,
        center: mapConfig.defaultCenter,
        zoom: mapConfig.defaultZoom,
        minZoom: mapConfig.minimumZoom,
        attributionControl: {},
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

      const emitViewport = (userInteraction: boolean) => {
        const bounds = map.getBounds();
        const center = map.getCenter();
        onViewportChangeRef.current({
          bounds: [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
          center: [center.lng, center.lat],
          zoom: map.getZoom(),
          userInteraction,
        });
      };

      const handlePointClick = (event: MapLayerMouseEvent) => {
        const id = event.features?.[0]?.properties.id;
        if (typeof id !== 'string') return;
        const report = reportsRef.current.find((item) => item.id === id);
        if (report) onReportSelectRef.current(report);
      };

      const handleClusterClick = (event: MapLayerMouseEvent) => {
        const feature = event.features?.[0];
        if (feature?.geometry.type !== 'Point') return;
        programmaticMoveRef.current = true;
        map.easeTo({
          center: feature.geometry.coordinates as [number, number],
          zoom: Math.min(map.getZoom() + 2, 18),
          duration: 450,
        });
      };

      const handleMoveEnd = () => {
        const wasProgrammatic = programmaticMoveRef.current;
        programmaticMoveRef.current = false;
        emitViewport(!wasProgrammatic);
      };

      const handlePointerEnter = () => {
        map.getCanvas().style.cursor = 'pointer';
      };
      const handlePointerLeave = () => {
        map.getCanvas().style.cursor = '';
      };

      map.on('load', () => {
        map.addSource(sourceId, {
          type: 'geojson',
          data: toFeatureCollection(reportsRef.current),
          cluster: true,
          clusterRadius: 44,
        });
        map.addLayer({
          id: clusterLayerId,
          type: 'circle',
          source: sourceId,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': colors.ink,
            'circle-radius': ['step', ['get', 'point_count'], 18, 10, 22, 30, 28],
            'circle-stroke-color': colors.surface,
            'circle-stroke-width': 3,
          },
        });
        map.addLayer({
          id: clusterCountLayerId,
          type: 'symbol',
          source: sourceId,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-size': 12,
          },
          paint: { 'text-color': colors.surface },
        });
        map.addLayer({
          id: pointLayerId,
          type: 'circle',
          source: sourceId,
          filter: ['!', ['has', 'point_count']],
          paint: {
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
            'circle-radius': 10,
            'circle-stroke-color': colors.surface,
            'circle-stroke-width': 3,
          },
        });

        map.on('click', pointLayerId, handlePointClick);
        map.on('click', clusterLayerId, handleClusterClick);
        map.on('mouseenter', pointLayerId, handlePointerEnter);
        map.on('mouseleave', pointLayerId, handlePointerLeave);
        map.on('mouseenter', clusterLayerId, handlePointerEnter);
        map.on('mouseleave', clusterLayerId, handlePointerLeave);
        emitViewport(false);
      });
      map.on('moveend', handleMoveEnd);

      return () => {
        markerRef.current?.remove();
        markerRef.current = null;
        map.remove();
        mapRef.current = null;
      };
    }, []);

    useEffect(() => {
      const source = mapRef.current?.getSource(sourceId) as GeoJSONSource | undefined;
      source?.setData(collection);
    }, [collection]);

    useEffect(() => {
      const map = mapRef.current;
      if (!map || !showsUserLocation || !userCoordinate) {
        markerRef.current?.remove();
        markerRef.current = null;
        return;
      }

      if (!markerRef.current) {
        const marker = document.createElement('div');
        marker.setAttribute('aria-label', 'Vị trí của tôi');
        Object.assign(marker.style, {
          width: '18px',
          height: '18px',
          border: `3px solid ${colors.surface}`,
          borderRadius: '50%',
          background: colors.info,
          boxShadow: `0 1px 6px ${colors.overlay}`,
        });
        markerRef.current = new maplibregl.Marker({ element: marker })
          .setLngLat(userCoordinate)
          .addTo(map);
      } else {
        markerRef.current.setLngLat(userCoordinate);
      }
    }, [showsUserLocation, userCoordinate]);

    return (
      <div
        ref={containerRef}
        aria-label="Bản đồ cộng đồng tương tác"
        role="application"
        style={{ width: '100%', height: '100%', backgroundColor: colors.canvas }}
      />
    );
  },
);
