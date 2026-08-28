import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Check,
  Clock3,
  Flag,
  MapPin,
  Sparkles,
  UsersRound,
  X,
} from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StatusBadge } from '@/components/ui';
import { useAuthGate } from '@/features/auth';
import { useFeatureRollout } from '@/features/feature-rollouts';
import { ReportSafetyNotice, ReportSourcesSection } from '@/features/safety';
import { colors, radius, spacing } from '@/theme';

import { ReportTimeline } from '../components/ReportTimeline';
import { useConfirmReport, useReport } from '../hooks/useReport';

const operationalLabels = {
  active: 'ĐANG DIỄN RA',
  monitoring: 'ĐANG THEO DÕI',
  resolving: 'ĐANG XỬ LÝ',
  resolved: 'ĐÃ GIẢI QUYẾT',
  expired: 'ĐÃ HẾT HẠN',
  rejected: 'ĐÃ GỠ',
} as const;

export function ReportDetailScreen({ id }: { id: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const requireAuth = useAuthGate();
  const reportQuery = useReport(id);
  const confirmation = useConfirmReport(id);
  const timelineRollout = useFeatureRollout('live_incident_timeline');

  const handleConfirmation = (kind: 'seen' | 'not_there') => {
    requireAuth(`/report/${id}`, () => confirmation.mutate(kind), 'Đăng nhập để xác nhận');
  };

  const report = reportQuery.data;
  if (!report) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.description}>
          {reportQuery.isLoading ? 'Đang tải…' : 'Không tìm thấy báo cáo.'}
        </Text>
      </View>
    );
  }

  const confirmable = ['active', 'monitoring', 'resolving'].includes(report.operationalStatus);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: confirmable ? 150 : spacing.xxl }}>
        <View style={[styles.hero, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.heroGlow} />
          <Pressable
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
            onPress={() => router.back()}
          >
            <ArrowLeft color={colors.ink} size={22} />
          </Pressable>
          <View style={styles.heroContent}>
            <View style={styles.heroSymbolWrap}>
              <Text style={styles.heroSymbol}>{report.categorySlug === 'music' ? '♪' : '!'}</Text>
            </View>
            <View>
              <Text style={styles.liveLabel}>{operationalLabels[report.operationalStatus]}</Text>
              <Text style={styles.category}>{report.categoryName}</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <StatusBadge status={report.verificationStatus} />
          <ReportSafetyNotice
            verificationStatus={report.verificationStatus}
            moderationStatus={report.moderationStatus}
            visibilityStatus={report.visibilityStatus}
            severity={report.severity}
          />
          <Text style={styles.title}>{report.title}</Text>
          <View style={styles.metaCard}>
            <View style={styles.metaRow}>
              <View style={styles.metaIcon}>
                <MapPin color={colors.primary} size={17} />
              </View>
              <Text style={styles.meta}>{report.addressLabel ?? 'Vị trí trên bản đồ'}</Text>
            </View>
            <View style={styles.metaRow}>
              <View style={styles.metaIcon}>
                <Clock3 color={colors.primary} size={17} />
              </View>
              <Text style={styles.meta}>Cập nhật gần đây</Text>
            </View>
          </View>

          <View style={styles.socialProof}>
            <UsersRound color={colors.primary} size={20} />
            <View style={styles.socialCopy}>
              <Text style={styles.socialValue}>{report.confirmationCount} người xác nhận</Text>
              <Text style={styles.socialMeta}>Tín hiệu từ cộng đồng quanh khu vực</Text>
            </View>
            <Sparkles color={colors.event} size={18} />
          </View>

          <Text style={styles.sectionLabel}>THÔNG TIN HIỆN TRƯỜNG</Text>
          <Text style={styles.description}>{report.description}</Text>

          <ReportSourcesSection sources={report.sources} />

          <Pressable
            style={({ pressed }) => [styles.flagAction, pressed && styles.pressed]}
            onPress={() =>
              requireAuth(
                `/report/${id}`,
                () => router.push({ pathname: '/safety/report/[id]', params: { id } }),
                'Đăng nhập để báo cáo nội dung',
              )
            }
          >
            <Flag color={colors.warning} size={17} />
            <Text style={styles.flagActionText}>Báo cáo thông tin sai hoặc nội dung vi phạm</Text>
          </Pressable>

          {timelineRollout.enabled ? (
            <ReportTimeline reportId={id} currentStatus={report.operationalStatus} />
          ) : null}

          {confirmation.isSuccess ? (
            <Text style={styles.success}>Cảm ơn bạn đã xác nhận.</Text>
          ) : null}
          {confirmation.isError ? <Text style={styles.error}>Không thể gửi xác nhận.</Text> : null}
        </View>
      </ScrollView>

      {confirmable ? (
        <View style={[styles.actionBar, { paddingBottom: insets.bottom + spacing.md }]}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryAction,
              pressed && styles.pressed,
              confirmation.isPending && styles.disabled,
            ]}
            disabled={confirmation.isPending}
            onPress={() => handleConfirmation('seen')}
          >
            <Check color={colors.accentInk} size={19} />
            <Text style={styles.primaryActionText}>Tôi cũng thấy</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryAction,
              pressed && styles.pressed,
              confirmation.isPending && styles.disabled,
            ]}
            disabled={confirmation.isPending}
            onPress={() => handleConfirmation('not_there')}
          >
            <X color={colors.ink} size={18} />
            <Text style={styles.secondaryActionText}>Không còn</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvas,
  },
  hero: {
    minHeight: 250,
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
    backgroundColor: colors.primary,
  },
  heroGlow: {
    position: 'absolute',
    top: -70,
    right: -55,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.accent,
    opacity: 0.75,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  heroContent: {
    marginTop: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  heroSymbolWrap: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  heroSymbol: { color: colors.primary, fontSize: 42, fontWeight: '800' },
  liveLabel: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  category: { marginTop: 4, color: colors.onPrimary, fontSize: 20, fontWeight: '800' },
  content: {
    marginTop: -32,
    marginHorizontal: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: spacing.xl,
  },
  title: {
    marginTop: spacing.md,
    color: colors.ink,
    fontSize: 29,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  metaCard: {
    marginTop: spacing.lg,
    gap: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.canvas,
    padding: spacing.md,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  metaIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
  },
  meta: { flex: 1, color: colors.inkMuted, fontSize: 13, fontWeight: '600' },
  socialProof: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.accentSoft,
    padding: spacing.lg,
  },
  socialCopy: { flex: 1 },
  socialValue: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  socialMeta: { marginTop: 2, color: colors.inkMuted, fontSize: 11 },
  sectionLabel: {
    marginTop: spacing.xl,
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  description: { marginTop: spacing.sm, color: colors.inkMuted, fontSize: 16, lineHeight: 26 },
  flagAction: {
    marginTop: spacing.xl,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: radius.lg,
    backgroundColor: colors.warningSoft,
    paddingHorizontal: spacing.md,
  },
  flagActionText: { flexShrink: 1, color: colors.ink, fontSize: 12, fontWeight: '800' },
  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.mapSurfaceStrong,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  primaryAction: {
    flex: 1.3,
    minHeight: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryActionText: { color: colors.accentInk, fontWeight: '800' },
  secondaryAction: {
    flex: 1,
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  secondaryActionText: { color: colors.ink, fontWeight: '700' },
  success: { marginTop: spacing.md, color: colors.primary, textAlign: 'center' },
  error: { marginTop: spacing.md, color: colors.danger, textAlign: 'center' },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
});
