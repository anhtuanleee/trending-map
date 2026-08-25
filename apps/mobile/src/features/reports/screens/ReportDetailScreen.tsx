import type { ReportViolationReason } from '@trending-map/contracts';
import * as Crypto from 'expo-crypto';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Clock3,
  Flag,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, StatusBadge } from '@/components/ui';
import { useAuthGate } from '@/features/auth';
import { useFeatureRollout } from '@/features/feature-rollouts';
import { colors, radius, spacing } from '@/theme';

import { ReportTimeline } from '../components/ReportTimeline';
import { useConfirmReport, useReport } from '../hooks/useReport';
import { useReportViolation } from '../hooks/useReportViolation';
import { LEGAL_DISCLAIMER } from '../model/report-form.config';

const operationalLabels = {
  active: 'ĐANG DIỄN RA',
  monitoring: 'ĐANG THEO DÕI',
  resolving: 'ĐANG XỬ LÝ',
  resolved: 'ĐÃ GIẢI QUYẾT',
  expired: 'ĐÃ HẾT HẠN',
  rejected: 'ĐÃ GỠ',
} as const;

const VIOLATION_REASONS: { key: ReportViolationReason; label: string; desc: string }[] = [
  {
    key: 'false_information',
    label: 'Thông tin sai sự thật',
    desc: 'Hiện trường thực tế không giống như báo cáo miêu tả',
  },
  {
    key: 'privacy_violation',
    label: 'Xâm phạm quyền hình ảnh / riêng tư',
    desc: 'Có ảnh chụp lén cận mặt cá nhân, biển số xe hoặc tư gia',
  },
  {
    key: 'panic_rumor',
    label: 'Tin đồn giật gân / hoang mang',
    desc: 'Suy đoán quá mức về vỡ đê, sập cầu, thảm họa chưa kiểm chứng',
  },
  {
    key: 'casualty_speculation',
    label: 'Nêu số liệu thương vong',
    desc: 'Đăng tải thông tin về người chết, mất tích, bị thương trái quy định',
  },
  {
    key: 'defamation',
    label: 'Công kích / bôi nhọ cá nhân',
    desc: 'Bình luận scandal, xúc phạm hoặc vu khống danh dự',
  },
  {
    key: 'other',
    label: 'Lý do khác',
    desc: 'Vi phạm quy chuẩn cộng đồng khác',
  },
];

export function ReportDetailScreen({ id }: { id: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const requireAuth = useAuthGate();
  const reportQuery = useReport(id);
  const confirmation = useConfirmReport(id);
  const violationMutation = useReportViolation();
  const timelineRollout = useFeatureRollout('live_incident_timeline');

  const [violationModalVisible, setViolationModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState<ReportViolationReason>('false_information');
  const [violationDetails, setViolationDetails] = useState('');
  const [violationSuccessMessage, setViolationSuccessMessage] = useState<string | null>(null);

  const handleConfirmation = (kind: 'seen' | 'not_there') => {
    requireAuth(`/report/${id}`, () => confirmation.mutate(kind), 'Đăng nhập để xác nhận');
  };

  const handleOpenViolation = () => {
    requireAuth(
      `/report/${id}`,
      () => setViolationModalVisible(true),
      'Đăng nhập để báo cáo vi phạm',
    );
  };

  const handleSubmitViolation = async () => {
    try {
      const result = await violationMutation.mutateAsync({
        reportId: id,
        reason: selectedReason,
        details: violationDetails.trim() || undefined,
        idempotencyKey: Crypto.randomUUID(),
      });
      setViolationModalVisible(false);
      setViolationSuccessMessage(
        result.message ?? 'Báo cáo vi phạm đã được gửi tới đội ngũ kiểm duyệt.',
      );
      setViolationDetails('');
    } catch {
      // Handled via violationMutation.isError
    }
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

          {/* Legal Disclaimer Box */}
          <View style={styles.disclaimerBox}>
            <ShieldCheck color={colors.primary} size={16} />
            <Text style={styles.disclaimerCopy}>{LEGAL_DISCLAIMER}</Text>
          </View>

          <Text style={styles.sectionLabel}>THÔNG TIN HIỆN TRƯỜNG</Text>
          <Text style={styles.description}>{report.description}</Text>

          {timelineRollout.enabled ? (
            <ReportTimeline reportId={id} currentStatus={report.operationalStatus} />
          ) : null}

          {confirmation.isSuccess ? (
            <Text style={styles.success}>Cảm ơn bạn đã xác nhận.</Text>
          ) : null}
          {confirmation.isError ? <Text style={styles.error}>Không thể gửi xác nhận.</Text> : null}

          {violationSuccessMessage ? (
            <View style={styles.violationSuccessCard}>
              <ShieldCheck color={colors.primary} size={18} />
              <Text style={styles.violationSuccessText}>{violationSuccessMessage}</Text>
            </View>
          ) : null}

          {/* Report False / Violation Button */}
          <Pressable
            style={({ pressed }) => [styles.violationButton, pressed && styles.pressed]}
            onPress={handleOpenViolation}
          >
            <Flag color={colors.danger} size={16} />
            <Text style={styles.violationButtonText}>Báo cáo sai sự thật / Xâm phạm quyền</Text>
          </Pressable>
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

      {/* Violation Reporting Modal */}
      <Modal
        visible={violationModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setViolationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderCopy}>
                <Text style={styles.modalTitle}>Báo cáo vi phạm hiện trường</Text>
                <Text style={styles.modalSubtitle}>
                  Giúp giữ môi trường thông tin trung thực, an toàn theo pháp luật
                </Text>
              </View>
              <Pressable style={styles.modalClose} onPress={() => setViolationModalVisible(false)}>
                <X color={colors.ink} size={20} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.reasonLabel}>Chọn lý do báo cáo:</Text>
              {VIOLATION_REASONS.map((item) => {
                const active = selectedReason === item.key;
                return (
                  <Pressable
                    key={item.key}
                    style={[styles.reasonOption, active && styles.reasonOptionActive]}
                    onPress={() => setSelectedReason(item.key)}
                  >
                    <View style={[styles.reasonRadio, active && styles.reasonRadioActive]}>
                      {active ? <View style={styles.reasonRadioDot} /> : null}
                    </View>
                    <View style={styles.reasonCopy}>
                      <Text style={[styles.reasonTitle, active && styles.reasonTitleActive]}>
                        {item.label}
                      </Text>
                      <Text style={styles.reasonDesc}>{item.desc}</Text>
                    </View>
                  </Pressable>
                );
              })}

              <Text style={styles.reasonLabel}>Mô tả thêm (Không bắt buộc):</Text>
              <TextInput
                value={violationDetails}
                onChangeText={setViolationDetails}
                multiline
                placeholder="Cung cấp thêm chi tiết để đội ngũ kiểm duyệt xử lý nhanh..."
                style={styles.violationInput}
              />

              {violationMutation.isError ? (
                <Text style={styles.error}>Gửi báo cáo thất bại. Vui lòng thử lại.</Text>
              ) : null}

              <View style={{ marginTop: spacing.lg }}>
                <AppButton
                  label={violationMutation.isPending ? 'Đang gửi…' : 'Gửi báo cáo vi phạm'}
                  tone="danger"
                  loading={violationMutation.isPending}
                  onPress={() => void handleSubmitViolation()}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
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
  disclaimerBox: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  disclaimerCopy: {
    flex: 1,
    color: colors.inkMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  sectionLabel: {
    marginTop: spacing.xl,
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  description: { marginTop: spacing.sm, color: colors.inkMuted, fontSize: 15, lineHeight: 24 },
  violationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
  },
  violationButtonText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  violationSuccessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  violationSuccessText: {
    flex: 1,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 37, 30, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalHeaderCopy: { flex: 1, paddingRight: spacing.md },
  modalTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  modalSubtitle: { color: colors.inkMuted, fontSize: 12, marginTop: 2 },
  modalClose: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  modalBody: { paddingVertical: spacing.md },
  reasonLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  reasonOptionActive: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  reasonRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.inkMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  reasonRadioActive: {
    borderColor: colors.danger,
  },
  reasonRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.danger,
  },
  reasonCopy: { flex: 1 },
  reasonTitle: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  reasonTitleActive: { color: colors.danger },
  reasonDesc: { color: colors.inkMuted, fontSize: 11, marginTop: 2 },
  violationInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.ink,
    fontSize: 13,
    textAlignVertical: 'top',
  },
});
