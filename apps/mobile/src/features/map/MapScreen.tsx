import type { MapBounds, ReportDetail } from '@trending-map/contracts';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Bell,
  ListFilter,
  LocateFixed,
  MapPinPlus,
  Search,
  SlidersHorizontal,
  UserRound,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Camera, GeoJSONSource, Layer, Map, UserLocation } from '@maplibre/maplibre-react-native';
import type {
  CameraRef,
  TrackUserLocationChangeEvent,
  ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import type { NativeSyntheticEvent } from 'react-native';
import type { FeatureCollection, Point } from 'geojson';
import type { PressEventWithFeatures } from '@maplibre/maplibre-react-native';

import { useAuthGate } from '@/features/auth/useAuthGate';
import { useMapReports, useNearbyReports } from '@/hooks/domain';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { useAuth } from '@/providers/AuthProvider';
import { colors, mapLayout, radius, spacing } from '@/theme';

import { ReportPreviewCard } from './ReportPreviewCard';
import { NearbyReportsSheet } from './NearbyReportsSheet';

const mapStyleUrl =
  process.env.EXPO_PUBLIC_MAP_STYLE_URL ?? 'https://demotiles.maplibre.org/style.json';

const categoryFilters = [
  { label: 'Tất cả', slugs: [] },
  { label: 'Giao thông', slugs: ['pothole'] },
  { label: 'Thời tiết', slugs: ['flood', 'storm'] },
  { label: 'Sự kiện', slugs: ['music'] },
] as const;

export function MapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ submitted?: string }>();
  const requireAuth = useAuthGate();
  const { user } = useAuth();
  const cameraRef = useRef<CameraRef>(null);
  const hasCenteredOnLocation = useRef(false);
  const viewportTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportDetail | null>(null);
  const [followingUser, setFollowingUser] = useState(false);
  const [viewportBounds, setViewportBounds] = useState<MapBounds | null>(null);
  const [viewportZoom, setViewportZoom] = useState<number>(mapLayout.defaultZoom);
  const [viewportCenter, setViewportCenter] = useState({
    longitude: mapLayout.defaultCenter[0],
    latitude: mapLayout.defaultCenter[1],
  });
  const [activeFilterIndex, setActiveFilterIndex] = useState(0);
  const [nearbyRadiusKm, setNearbyRadiusKm] = useState(5);
  const [nearbyVisible, setNearbyVisible] = useState(false);
  const currentLocation = useCurrentLocation();
  const activeCategorySlugs = [...categoryFilters[activeFilterIndex].slugs];
  const referenceCenter =
    followingUser && currentLocation.location
      ? {
          latitude: currentLocation.location.coords.latitude,
          longitude: currentLocation.location.coords.longitude,
        }
      : viewportCenter;
  const modeLabel = followingUser && currentLocation.location ? 'Quanh tôi' : 'Khu vực trên bản đồ';
  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useMapReports({
    bounds: viewportBounds,
    zoom: viewportZoom,
    categorySlugs: activeCategorySlugs,
    center: referenceCenter,
  });
  const nearbyQuery = useNearbyReports(referenceCenter, nearbyRadiusKm, activeCategorySlugs);

  const geoJson = useMemo<FeatureCollection<Point>>(
    () => ({
      type: 'FeatureCollection',
      features: data.map((report) => ({
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
    }),
    [data],
  );

  useEffect(() => {
    if (!currentLocation.location || hasCenteredOnLocation.current) return;
    hasCenteredOnLocation.current = true;
    setFollowingUser(true);
    cameraRef.current?.easeTo({
      center: [currentLocation.location.coords.longitude, currentLocation.location.coords.latitude],
      zoom: 15,
      duration: 700,
    });
  }, [currentLocation.location]);

  useEffect(
    () => () => {
      if (viewportTimerRef.current) clearTimeout(viewportTimerRef.current);
    },
    [],
  );

  const handleShapePress = (event: NativeSyntheticEvent<PressEventWithFeatures>) => {
    const id = event.nativeEvent.features[0]?.properties?.id;
    if (typeof id !== 'string') return;
    const report = data.find((item) => item.id === id);
    if (report) setSelectedReport(report);
  };

  const handleLocate = async () => {
    if (currentLocation.isBusy) return;
    const resolved = await currentLocation.startTracking();
    const target = resolved ?? currentLocation.location;
    if (!target) return;

    hasCenteredOnLocation.current = true;
    setFollowingUser(true);
    cameraRef.current?.easeTo({
      center: [target.coords.longitude, target.coords.latitude],
      zoom: 15,
      duration: 700,
    });
  };

  const handleTrackingChange = (event: NativeSyntheticEvent<TrackUserLocationChangeEvent>) => {
    setFollowingUser(event.nativeEvent.trackUserLocation !== null);
  };

  const handleRegionDidChange = (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
    const [west, south, east, north] = event.nativeEvent.bounds;
    const [longitude, latitude] = event.nativeEvent.center;
    const zoom = event.nativeEvent.zoom;
    if (west >= east || south >= north) return;
    if (event.nativeEvent.userInteraction) setFollowingUser(false);

    if (viewportTimerRef.current) clearTimeout(viewportTimerRef.current);
    viewportTimerRef.current = setTimeout(() => {
      setViewportBounds({ west, south, east, north });
      setViewportZoom(zoom);
      setViewportCenter({ longitude, latitude });
    }, 350);
  };

  const handleNearbySelect = (report: ReportDetail) => {
    setNearbyVisible(false);
    setFollowingUser(false);
    setSelectedReport(report);
    cameraRef.current?.easeTo({
      center: [report.coordinate.longitude, report.coordinate.latitude],
      zoom: Math.max(15, viewportZoom),
      duration: 500,
    });
  };

  const handleConfirm = (report: ReportDetail) => {
    requireAuth(
      `/?reportId=${report.id}`,
      () => router.push({ pathname: '/report/[id]', params: { id: report.id } }),
      'Đăng nhập để xác nhận',
    );
  };

  const handleAccount = () => {
    if (user) {
      router.push('/account');
      return;
    }
    router.push({ pathname: '/auth', params: { returnTo: '/account' } });
  };

  return (
    <View style={styles.container}>
      <Map
        style={styles.map}
        mapStyle={mapStyleUrl}
        compass={false}
        onRegionDidChange={handleRegionDidChange}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{ center: mapLayout.defaultCenter, zoom: mapLayout.defaultZoom }}
          minZoom={mapLayout.minimumZoom}
          trackUserLocation={followingUser ? 'default' : undefined}
          onTrackUserLocationChange={handleTrackingChange}
        />
        {currentLocation.location ? (
          <UserLocation animated accuracy heading minDisplacement={10} />
        ) : null}
        <GeoJSONSource
          id="community-reports"
          data={geoJson}
          cluster
          clusterRadius={44}
          onPress={handleShapePress}
        >
          <Layer
            id="report-clusters"
            type="circle"
            filter={['has', 'point_count']}
            paint={{
              'circle-color': colors.ink,
              'circle-radius': ['step', ['get', 'point_count'], 18, 10, 22, 30, 28],
              'circle-stroke-color': colors.surface,
              'circle-stroke-width': 3,
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
              'circle-radius': 10,
              'circle-stroke-color': colors.surface,
              'circle-stroke-width': 3,
            }}
          />
        </GeoJSONSource>
      </Map>

      <View style={styles.header}>
        <View style={styles.brandBlock}>
          <Text style={styles.brand}>Mạch Phố</Text>
          <Text style={styles.subtitle}>
            {!followingUser && viewportBounds
              ? 'Khu vực trên bản đồ'
              : currentLocation.source === 'last-known'
                ? `Vị trí gần nhất · ${currentLocation.accuracyLabel ?? 'đang cập nhật'}`
                : followingUser && currentLocation.location
                  ? `Quanh tôi · ${
                      currentLocation.precision === 'approximate'
                        ? 'vị trí gần đúng'
                        : (currentLocation.accuracyLabel ?? 'đang cập nhật')
                    }`
                  : 'Quận 1 · trực tiếp'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable accessibilityLabel="Thông báo" style={styles.iconButton}>
            <Bell color={colors.ink} size={20} />
          </Pressable>
          <Pressable
            accessibilityLabel="Tài khoản"
            style={styles.iconButton}
            onPress={handleAccount}
          >
            <UserRound color={user ? colors.primary : colors.ink} size={20} />
            {user ? <View style={styles.accountDot} /> : null}
          </Pressable>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Search color={colors.inkMuted} size={19} />
        <Text style={styles.searchText}>Tìm khu vực hoặc sự kiện</Text>
        <SlidersHorizontal color={colors.ink} size={19} />
      </View>

      <View style={styles.chips}>
        {categoryFilters.map((filter, index) => (
          <Pressable
            key={filter.label}
            style={[styles.chip, index === activeFilterIndex && styles.chipActive]}
            onPress={() => setActiveFilterIndex(index)}
          >
            <Text style={[styles.chipText, index === activeFilterIndex && styles.chipTextActive]}>
              {filter.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải dữ liệu quanh bạn…</Text>
        </View>
      ) : null}
      {isError ? (
        <Pressable style={styles.error} onPress={() => void refetch()}>
          <Text style={styles.errorText}>Không thể tải dữ liệu bản đồ.</Text>
          <Text style={styles.errorAction}>Thử lại</Text>
        </Pressable>
      ) : null}
      {!params.submitted && !isLoading && !isError && data.length === 0 ? (
        <Text style={styles.empty}>Chưa có báo cáo trong khu vực này.</Text>
      ) : null}
      {currentLocation.error ? (
        <Pressable
          style={styles.locationError}
          onPress={() =>
            currentLocation.status === 'blocked' || currentLocation.status === 'services_disabled'
              ? void currentLocation.openSettings()
              : void currentLocation.startTracking()
          }
        >
          <Text style={styles.locationErrorText}>{currentLocation.error}</Text>
          <Text style={styles.locationErrorAction}>
            {currentLocation.status === 'blocked' || currentLocation.status === 'services_disabled'
              ? 'Mở Cài đặt'
              : 'Thử lại'}
          </Text>
        </Pressable>
      ) : null}
      {params.submitted ? (
        <Text style={styles.success}>Báo cáo đã được gửi để xác minh.</Text>
      ) : null}

      <Pressable
        style={styles.locate}
        disabled={currentLocation.isBusy}
        onPress={handleLocate}
        accessibilityLabel="Về vị trí của tôi"
      >
        {currentLocation.isBusy ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <LocateFixed color={currentLocation.isTracking ? colors.primary : colors.ink} size={21} />
        )}
      </Pressable>

      <Pressable
        accessibilityLabel="Mở danh sách báo cáo gần đây"
        style={styles.nearbyButton}
        onPress={() => setNearbyVisible(true)}
      >
        <ListFilter color={colors.ink} size={18} />
        <View>
          <Text style={styles.nearbyButtonTitle}>{modeLabel}</Text>
          <Text style={styles.nearbyButtonMeta}>
            {nearbyQuery.data?.length ?? 0} báo cáo · {nearbyRadiusKm} km
          </Text>
        </View>
      </Pressable>

      <Pressable
        style={styles.reportButton}
        onPress={() =>
          requireAuth('/report/new', () => router.push('/report/new'), 'Đăng nhập để báo cáo')
        }
      >
        <MapPinPlus color="#fff" size={20} />
        <Text style={styles.reportButtonText}>Báo cáo tại đây</Text>
      </Pressable>

      {selectedReport ? (
        <ReportPreviewCard
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onConfirm={() => handleConfirm(selectedReport)}
        />
      ) : null}

      <NearbyReportsSheet
        visible={nearbyVisible}
        modeLabel={modeLabel}
        reports={nearbyQuery.data ?? []}
        radiusKm={nearbyRadiusKm}
        isLoading={nearbyQuery.isLoading}
        isError={nearbyQuery.isError}
        onRadiusChange={setNearbyRadiusKm}
        onRetry={() => void nearbyQuery.refetch()}
        onSelect={handleNearbySelect}
        onClose={() => setNearbyVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  map: { flex: 1 },
  header: {
    position: 'absolute',
    top: 58,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandBlock: {
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  brand: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  subtitle: { marginTop: 2, color: colors.inkMuted, fontSize: 11 },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  accountDot: {
    position: 'absolute',
    right: 9,
    bottom: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.surface,
    backgroundColor: colors.primary,
  },
  searchBar: {
    position: 'absolute',
    top: 124,
    left: spacing.lg,
    right: spacing.lg,
    minHeight: 50,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  searchText: { flex: 1, color: colors.inkMuted, fontSize: 14 },
  chips: {
    position: 'absolute',
    top: 184,
    left: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: { backgroundColor: colors.ink },
  chipText: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: '#fff' },
  loading: {
    position: 'absolute',
    top: 236,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  loadingText: { color: colors.inkMuted, fontSize: 12 },
  error: {
    position: 'absolute',
    top: 236,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  errorText: { color: colors.danger, fontSize: 12 },
  errorAction: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  empty: {
    position: 'absolute',
    top: 236,
    alignSelf: 'center',
    color: colors.inkMuted,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 12,
  },
  locationError: {
    position: 'absolute',
    top: 276,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  locationErrorText: { flex: 1, color: colors.danger, fontSize: 12, lineHeight: 17 },
  locationErrorAction: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  success: {
    position: 'absolute',
    top: 236,
    alignSelf: 'center',
    color: colors.primary,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontWeight: '700',
  },
  locate: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 156,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nearbyButton: {
    position: 'absolute',
    left: spacing.lg,
    bottom: 146,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  nearbyButtonTitle: { color: colors.ink, fontSize: 12, fontWeight: '900' },
  nearbyButtonMeta: { marginTop: 2, color: colors.inkMuted, fontSize: 10 },
  reportButton: {
    position: 'absolute',
    bottom: 78,
    alignSelf: 'center',
    minHeight: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  reportButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
