import type { MapItem } from '@trending-map/contracts';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ListFilter, LocateFixed, MapPinPlus } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { mapCategoryFilters, mapConfig } from '@/config';
import { useAuth, useAuthGate } from '@/features/auth';
import { useCurrentLocation } from '@/features/location';
import { colors } from '@/theme';

import { CommunityMapSurface, type CommunityMapCameraRef } from '../components/CommunityMapSurface';
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
  const cameraRef = useRef<CommunityMapCameraRef>(null);
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
    <View className="flex-1 bg-canvas">
      <CommunityMapSurface
        ref={cameraRef}
        reports={data}
        followingUser={followingUser}
        showsUserLocation={Boolean(currentLocation.location)}
        userCoordinate={
          currentLocation.location
            ? [currentLocation.location.coords.longitude, currentLocation.location.coords.latitude]
            : null
        }
        onReportSelect={setSelectedReport}
        onTrackingChange={setFollowingUser}
        onViewportChange={viewport.handleRegionDidChange}
      />

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
        <View className="absolute top-[236px] self-center flex-row gap-2 rounded-pill bg-surface px-3 py-2">
          <ActivityIndicator color={colors.primary} />
          <Text className="text-xs text-muted">Đang tải dữ liệu quanh bạn…</Text>
        </View>
      ) : null}
      {isError ? (
        <Pressable
          className="absolute top-[236px] self-center flex-row items-center gap-2 rounded-pill bg-surface px-3 py-2"
          onPress={() => void refetch()}
        >
          <Text className="text-xs text-danger">Không thể tải dữ liệu bản đồ.</Text>
          <Text className="text-xs font-black text-primary">Thử lại</Text>
        </Pressable>
      ) : null}
      {!params.submitted && !isLoading && !isError && data.length === 0 ? (
        <Text className="absolute top-[236px] self-center rounded-pill bg-surface px-3 py-2 text-xs text-muted">
          Chưa có báo cáo trong khu vực này.
        </Text>
      ) : null}
      {currentLocation.error ? (
        <Pressable
          className="absolute left-4 right-4 top-[276px] flex-row items-center gap-2 rounded-md bg-surface p-3"
          onPress={() =>
            currentLocation.status === 'blocked' || currentLocation.status === 'services_disabled'
              ? void currentLocation.openSettings()
              : void currentLocation.startTracking()
          }
        >
          <Text className="flex-1 text-xs leading-[17px] text-danger">{currentLocation.error}</Text>
          <Text className="text-xs font-black text-primary">
            {currentLocation.status === 'blocked' || currentLocation.status === 'services_disabled'
              ? 'Mở Cài đặt'
              : 'Thử lại'}
          </Text>
        </Pressable>
      ) : null}
      {params.submitted ? (
        <Text className="absolute top-[236px] self-center rounded-pill bg-surface px-3 py-2 font-bold text-primary">
          Báo cáo đã được gửi để xác minh.
        </Text>
      ) : null}

      <Pressable
        className="absolute bottom-[156px] right-4 h-12 w-12 items-center justify-center rounded-full bg-surface active:bg-primary-soft"
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
        className="absolute bottom-[146px] left-4 min-h-14 flex-row items-center gap-2 rounded-md bg-surface px-3 active:bg-primary-soft"
        onPress={() => setNearbyVisible(true)}
      >
        <ListFilter color={colors.ink} size={18} />
        <View>
          <Text className="text-xs font-black text-ink">{modeLabel}</Text>
          <Text className="mt-0.5 text-[10px] text-muted">
            {nearbyQuery.data?.length ?? 0} báo cáo · {nearbyRadiusKm} km
          </Text>
        </View>
      </Pressable>

      <Pressable
        className="absolute bottom-[78px] min-h-[52px] self-center flex-row items-center gap-2 rounded-pill bg-primary px-6 active:bg-primary-pressed"
        onPress={() =>
          requireAuth('/report/new', () => router.push('/report/new'), 'Đăng nhập để báo cáo')
        }
      >
        <MapPinPlus color={colors.onPrimary} size={20} />
        <Text className="text-[15px] font-extrabold text-white">Báo cáo tại đây</Text>
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
