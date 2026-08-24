import type { MapItem } from '@trending-map/contracts';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ListFilter, LocateFixed, MapPinPlus } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Camera, Map, UserLocation } from '@maplibre/maplibre-react-native';
import type { CameraRef, TrackUserLocationChangeEvent } from '@maplibre/maplibre-react-native';
import type { NativeSyntheticEvent } from 'react-native';

import { mapCategoryFilters, mapConfig } from '@/config';
import { useAuth, useAuthGate } from '@/features/auth';
import { useCurrentLocation } from '@/features/location';
import { colors, radius, spacing } from '@/theme';

import { CommunityReportsLayer } from '../components/CommunityReportsLayer';
import { MapHeaderControls } from '../components/MapHeaderControls';
import { NearbyReportsSheet } from '../components/NearbyReportsSheet';
import { RecentAreasSheet } from '../components/RecentAreasSheet';
import { ReportPreviewCard } from '../components/ReportPreviewCard';
import type { RecentArea } from '../data/recent-areas.repository';
import { useMapReports, useNearbyReports } from '../hooks/useMapReports';
import { useMapViewport } from '../hooks/useMapViewport';
import { useRecentAreas } from '../hooks/useRecentAreas';

export function MapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ submitted?: string }>();
  const requireAuth = useAuthGate();
  const { user } = useAuth();
  const cameraRef = useRef<CameraRef>(null);
  const hasCenteredOnLocation = useRef(false);
  const [selectedReport, setSelectedReport] = useState<MapItem | null>(null);
  const [followingUser, setFollowingUser] = useState(false);
  const [activeFilterIndex, setActiveFilterIndex] = useState(0);
  const [nearbyRadiusKm, setNearbyRadiusKm] = useState(5);
  const [nearbyVisible, setNearbyVisible] = useState(false);
  const [recentAreasVisible, setRecentAreasVisible] = useState(false);
  const currentLocation = useCurrentLocation();
  const recentAreas = useRecentAreas();
  const viewport = useMapViewport({
    onUserInteraction: () => setFollowingUser(false),
    onUserRegionChange: (center, zoom) => void recentAreas.record(center, zoom),
  });
  const activeCategorySlugs = [...mapCategoryFilters[activeFilterIndex].slugs];
  const referenceCenter =
    followingUser && currentLocation.location
      ? {
          latitude: currentLocation.location.coords.latitude,
          longitude: currentLocation.location.coords.longitude,
        }
      : viewport.center;
  const modeLabel = followingUser && currentLocation.location ? 'Quanh tôi' : 'Khu vực trên bản đồ';
  const locationSubtitle =
    !followingUser && viewport.bounds
      ? 'Khu vực trên bản đồ'
      : currentLocation.source === 'last-known'
        ? `Vị trí gần nhất · ${currentLocation.accuracyLabel ?? 'đang cập nhật'}`
        : followingUser && currentLocation.location
          ? `Quanh tôi · ${
              currentLocation.precision === 'approximate'
                ? 'vị trí gần đúng'
                : (currentLocation.accuracyLabel ?? 'đang cập nhật')
            }`
          : 'Quận 1 · trực tiếp';
  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useMapReports({
    bounds: viewport.bounds,
    zoom: viewport.zoom,
    categorySlugs: activeCategorySlugs,
    center: referenceCenter,
  });
  const nearbyQuery = useNearbyReports(referenceCenter, nearbyRadiusKm, activeCategorySlugs);

  useEffect(() => {
    if (!currentLocation.location || hasCenteredOnLocation.current) return;
    hasCenteredOnLocation.current = true;
    setFollowingUser(true);
    cameraRef.current?.easeTo({
      center: [currentLocation.location.coords.longitude, currentLocation.location.coords.latitude],
      zoom: mapConfig.focusedZoom,
      duration: mapConfig.cameraDurationMs,
    });
  }, [currentLocation.location]);

  const handleLocate = async () => {
    if (currentLocation.isBusy) return;
    const resolved = await currentLocation.startTracking();
    const target = resolved ?? currentLocation.location;
    if (!target) return;

    hasCenteredOnLocation.current = true;
    setFollowingUser(true);
    cameraRef.current?.easeTo({
      center: [target.coords.longitude, target.coords.latitude],
      zoom: mapConfig.focusedZoom,
      duration: mapConfig.cameraDurationMs,
    });
  };

  const handleTrackingChange = (event: NativeSyntheticEvent<TrackUserLocationChangeEvent>) => {
    setFollowingUser(event.nativeEvent.trackUserLocation !== null);
  };

  const handleNearbySelect = (report: MapItem) => {
    setNearbyVisible(false);
    setFollowingUser(false);
    setSelectedReport(report);
    cameraRef.current?.easeTo({
      center: [report.coordinate.longitude, report.coordinate.latitude],
      zoom: Math.max(mapConfig.focusedZoom, viewport.zoom),
      duration: 500,
    });
  };

  const handleRecentAreaSelect = (area: RecentArea) => {
    setRecentAreasVisible(false);
    setFollowingUser(false);
    cameraRef.current?.easeTo({
      center: [area.center.longitude, area.center.latitude],
      zoom: area.zoom,
      duration: 500,
    });
  };

  const handleConfirm = (report: MapItem) => {
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
        mapStyle={mapConfig.styleUrl}
        compass={false}
        onRegionDidChange={viewport.handleRegionDidChange}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{ center: mapConfig.defaultCenter, zoom: mapConfig.defaultZoom }}
          minZoom={mapConfig.minimumZoom}
          trackUserLocation={followingUser ? 'default' : undefined}
          onTrackUserLocationChange={handleTrackingChange}
        />
        {currentLocation.location ? (
          <UserLocation animated accuracy heading minDisplacement={10} />
        ) : null}
        <CommunityReportsLayer reports={data} onSelect={setSelectedReport} />
      </Map>

      <MapHeaderControls
        subtitle={locationSubtitle}
        activeFilterIndex={activeFilterIndex}
        hasRecentAreas={recentAreas.areas.length > 0}
        isAuthenticated={Boolean(user)}
        onFilterChange={setActiveFilterIndex}
        onOpenRecentAreas={() => setRecentAreasVisible(true)}
        onOpenAccount={handleAccount}
      />

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
        <MapPinPlus color={colors.onPrimary} size={20} />
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
      <RecentAreasSheet
        visible={recentAreasVisible}
        areas={recentAreas.areas}
        isLoading={recentAreas.isLoading}
        error={recentAreas.error}
        onSelect={handleRecentAreaSelect}
        onTogglePin={(id) => void recentAreas.togglePin(id)}
        onClose={() => setRecentAreasVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  map: { flex: 1 },
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
  reportButtonText: { color: colors.onPrimary, fontSize: 15, fontWeight: '800' },
});
