import type {
  OperationalStatus,
  ReportTimelineItem,
  UpdateOperationalStatus,
} from '@trending-map/contracts';
import {
  Activity,
  CircleCheck,
  FileText,
  Plus,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

import {
  useAddReportUpdate,
  useCanUpdateReport,
  useReportTimeline,
} from '../hooks/useReportTimeline';

const statusOptions: Array<{
  value: UpdateOperationalStatus;
  label: string;
  description: string;
}> = [
  { value: 'resolving', label: 'Đang xử lý', description: 'Sự việc đang được khắc phục.' },
  { value: 'resolved', label: 'Đã giải quyết', description: 'Tình trạng hiện không còn.' },
  { value: 'active', label: 'Vẫn đang diễn ra', description: 'Mở lại khi tình trạng tái diễn.' },
];

const statusLabels: Record<OperationalStatus, string> = {
  active: 'Vẫn đang diễn ra',
  monitoring: 'Đang theo dõi',
  resolving: 'Đang xử lý',
  resolved: 'Đã giải quyết',
  expired: 'Đã hết hạn',
  rejected: 'Đã gỡ',
};

const allowedTransitions: Record<OperationalStatus, UpdateOperationalStatus[]> = {
  active: ['resolving', 'resolved'],
  monitoring: ['active', 'resolving', 'resolved'],
  resolving: ['active', 'resolved'],
  resolved: ['active'],
  expired: [],
  rejected: [],
};

function defaultTarget(currentStatus: OperationalStatus): UpdateOperationalStatus {
  return allowedTransitions[currentStatus][0] ?? 'active';
}

function timelineTime(value: string) {
  return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function TimelineItem({ item, last }: { item: ReportTimelineItem; last: boolean }) {
  const status = item.operationalStatus ? statusLabels[item.operationalStatus] : null;

  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineRail}>
        <View style={[styles.timelineDot, item.official && styles.officialDot]}>
          {item.official ? (
            <ShieldCheck color={colors.onPrimary} size={13} />
          ) : (
            <Activity color={colors.primary} size={13} />
          )}
        </View>
        {!last ? <View style={styles.timelineLine} /> : null}
      </View>
      <View style={styles.timelineContent}>
        <View style={styles.timelineMetaRow}>
          <Text style={styles.timelineKind}>
            {item.official ? (item.sourceLabel ?? 'Nguồn chính thức') : 'Cập nhật cộng đồng'}
          </Text>
          <Text style={styles.timelineTime}>{timelineTime(item.createdAt)}</Text>
        </View>
        {status ? <Text style={styles.timelineStatus}>{status}</Text> : null}
        {item.body ? <Text style={styles.timelineBody}>{item.body}</Text> : null}
      </View>
    </View>
  );
}

export function ReportTimeline({
  reportId,
  currentStatus,
}: {
  reportId: string;
  currentStatus: OperationalStatus;
}) {
  const timeline = useReportTimeline(reportId);
  const permission = useCanUpdateReport(reportId);
  const addUpdate = useAddReportUpdate(reportId);
  const [modalVisible, setModalVisible] = useState(false);
  const [mode, setMode] = useState<'note' | 'status_change'>('note');
  const [body, setBody] = useState('');
  const [targetStatus, setTargetStatus] = useState<UpdateOperationalStatus>(() =>
    defaultTarget(currentStatus),
  );

  useEffect(() => {
    setTargetStatus(defaultTarget(currentStatus));
  }, [currentStatus]);

  const resetComposer = () => {
    setBody('');
    setMode('note');
    setTargetStatus(defaultTarget(currentStatus));
    addUpdate.reset();
  };

  const closeComposer = () => {
    setModalVisible(false);
    resetComposer();
  };

  const submitDisabled =
    addUpdate.isPending ||
    (mode === 'note' && body.trim().length === 0) ||
    (mode === 'status_change' && !allowedTransitions[currentStatus].includes(targetStatus));

  const handleSubmit = () => {
    addUpdate.mutate(
      {
        kind: mode,
        body: body.trim() || undefined,
        operationalStatus: mode === 'status_change' ? targetStatus : undefined,
      },
      { onSuccess: closeComposer },
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.eyebrow}>CẬP NHẬT TRỰC TIẾP</Text>
          <Text style={styles.sectionTitle}>Diễn biến mới nhất</Text>
        </View>
        {permission.data?.canUpdate ? (
          <Pressable
            accessibilityLabel="Thêm cập nhật"
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
            onPress={() => setModalVisible(true)}
          >
            <Plus color={colors.primary} size={18} />
          </Pressable>
        ) : null}
      </View>

      {timeline.isLoading ? (
        <View style={styles.feedbackRow}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.feedbackText}>Đang tải diễn biến…</Text>
        </View>
      ) : null}

      {timeline.isError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>Chưa tải được cập nhật hiện trường.</Text>
          <Pressable style={styles.retryButton} onPress={() => timeline.refetch()}>
            <RotateCcw color={colors.danger} size={15} />
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : null}

      {timeline.data?.length === 0 ? (
        <View style={styles.emptyCard}>
          <FileText color={colors.inkMuted} size={21} />
          <Text style={styles.emptyTitle}>Chưa có cập nhật mới</Text>
          <Text style={styles.emptyText}>Thông tin ban đầu vẫn là dữ liệu gần nhất.</Text>
        </View>
      ) : null}

      {timeline.data?.map((item, index) => (
        <TimelineItem key={item.id} item={item} last={index === timeline.data.length - 1} />
      ))}

      <Modal
        animationType="slide"
        onRequestClose={closeComposer}
        transparent
        visible={modalVisible}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <Pressable style={styles.modalDismissArea} onPress={closeComposer} />
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>REPORT CỦA BẠN</Text>
                <Text style={styles.modalTitle}>Thêm cập nhật</Text>
              </View>
              <Pressable style={styles.closeButton} onPress={closeComposer}>
                <X color={colors.ink} size={20} />
              </Pressable>
            </View>

            <View style={styles.modeTabs}>
              <Pressable
                style={[styles.modeTab, mode === 'note' && styles.modeTabActive]}
                onPress={() => setMode('note')}
              >
                <Text style={[styles.modeLabel, mode === 'note' && styles.modeLabelActive]}>
                  Ghi chú
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modeTab, mode === 'status_change' && styles.modeTabActive]}
                onPress={() => setMode('status_change')}
              >
                <Text
                  style={[styles.modeLabel, mode === 'status_change' && styles.modeLabelActive]}
                >
                  Trạng thái
                </Text>
              </Pressable>
            </View>

            {mode === 'status_change' ? (
              <View style={styles.statusList}>
                {statusOptions.map((option) => {
                  const selected = targetStatus === option.value;
                  const allowed = allowedTransitions[currentStatus].includes(option.value);
                  return (
                    <Pressable
                      key={option.value}
                      disabled={!allowed}
                      style={[
                        styles.statusOption,
                        selected && styles.statusOptionSelected,
                        !allowed && styles.statusOptionDisabled,
                      ]}
                      onPress={() => setTargetStatus(option.value)}
                    >
                      <View style={styles.statusOptionCopy}>
                        <Text style={styles.statusOptionTitle}>{option.label}</Text>
                        <Text style={styles.statusOptionText}>
                          {currentStatus === option.value
                            ? 'Trạng thái hiện tại'
                            : allowed
                              ? option.description
                              : 'Không thể chuyển trực tiếp'}
                        </Text>
                      </View>
                      {selected ? <CircleCheck color={colors.primary} size={20} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            <TextInput
              maxLength={1000}
              multiline
              onChangeText={setBody}
              placeholder={
                mode === 'note'
                  ? 'Mô tả tình hình mới tại hiện trường…'
                  : 'Thêm chi tiết (không bắt buộc)…'
              }
              placeholderTextColor={colors.inkMuted}
              style={styles.input}
              textAlignVertical="top"
              value={body}
            />

            {addUpdate.isError ? (
              <Text style={styles.composerError}>Không thể gửi cập nhật. Hãy thử lại.</Text>
            ) : null}

            <AppButton
              disabled={submitDisabled}
              label="Đăng cập nhật"
              loading={addUpdate.isPending}
              onPress={handleSubmit}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.xxl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  sectionTitle: { marginTop: 3, color: colors.ink, fontSize: 20, fontWeight: '800' },
  addButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  timelineRow: { flexDirection: 'row', minHeight: 78 },
  timelineRail: { width: 36, alignItems: 'center' },
  timelineDot: {
    zIndex: 1,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  officialDot: { backgroundColor: colors.official },
  timelineLine: { width: 2, flex: 1, backgroundColor: colors.border },
  timelineContent: { flex: 1, paddingBottom: spacing.lg, paddingLeft: spacing.sm },
  timelineMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  timelineKind: { flex: 1, color: colors.inkMuted, fontSize: 11, fontWeight: '700' },
  timelineTime: { color: colors.inkMuted, fontSize: 10 },
  timelineStatus: { marginTop: 4, color: colors.primary, fontSize: 14, fontWeight: '800' },
  timelineBody: { marginTop: 4, color: colors.ink, fontSize: 14, lineHeight: 21 },
  feedbackRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  feedbackText: { color: colors.inkMuted, fontSize: 13 },
  errorCard: { borderRadius: radius.md, backgroundColor: colors.dangerSoft, padding: spacing.md },
  errorText: { color: colors.danger, fontSize: 13 },
  retryButton: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
  },
  retryText: { color: colors.danger, fontSize: 12, fontWeight: '800' },
  emptyCard: {
    alignItems: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.xl,
  },
  emptyTitle: { marginTop: spacing.sm, color: colors.ink, fontSize: 14, fontWeight: '800' },
  emptyText: { marginTop: 3, color: colors.inkMuted, fontSize: 12, textAlign: 'center' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  modalDismissArea: { flex: 1 },
  modalCard: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lgPlus,
    paddingBottom: spacing.xxl,
  },
  modalHandle: {
    width: 44,
    height: 5,
    alignSelf: 'center',
    marginVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  modalEyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  modalTitle: { marginTop: 2, color: colors.ink, fontSize: 24, fontWeight: '800' },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  modeTabs: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.xs,
  },
  modeTab: { flex: 1, alignItems: 'center', borderRadius: radius.sm, paddingVertical: spacing.sm },
  modeTabActive: { backgroundColor: colors.surface },
  modeLabel: { color: colors.inkMuted, fontSize: 12, fontWeight: '800' },
  modeLabelActive: { color: colors.primary },
  statusList: { marginTop: spacing.md, gap: spacing.sm },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  statusOptionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  statusOptionDisabled: { opacity: 0.5 },
  statusOptionCopy: { flex: 1 },
  statusOptionTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  statusOptionText: { marginTop: 2, color: colors.inkMuted, fontSize: 11 },
  input: {
    minHeight: 108,
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.canvas,
    color: colors.ink,
    padding: spacing.md,
    fontSize: 14,
    lineHeight: 21,
  },
  composerError: { marginBottom: spacing.sm, color: colors.danger, fontSize: 12 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.97 }] },
});
