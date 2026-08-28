import type { ContentFlagReason } from '@trending-map/contracts';
import * as Crypto from 'expo-crypto';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, Flag, Send } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

import { useSubmitContentFlag } from '../hooks/useSubmitContentFlag';
import { contentFlagOptions } from '../model/content-flag-options';

export function ContentFlagScreen({ reportId }: { reportId: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mutation = useSubmitContentFlag();
  const [reason, setReason] = useState<ContentFlagReason>('false_information');
  const [description, setDescription] = useState('');
  const needsDescription = reason === 'other';
  const canSubmit = !needsDescription || description.trim().length > 0;

  const submit = () => {
    mutation.mutate({
      reportId,
      reason,
      description: description.trim() || undefined,
      idempotencyKey: Crypto.randomUUID(),
    });
  };

  if (mutation.isSuccess) {
    return (
      <View
        style={[styles.successScreen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      >
        <View style={styles.successIcon}>
          <CheckCircle2 color={colors.primary} size={34} />
        </View>
        <Text style={styles.successTitle}>Đã gửi yêu cầu xem xét</Text>
        <Text style={styles.successBody}>
          Điều phối viên sẽ kiểm tra nội dung và nguồn liên quan. Báo cáo vi phạm không tự động làm
          nội dung biến mất.
        </Text>
        <AppButton label="Quay lại báo cáo" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Quay lại" style={styles.back} onPress={() => router.back()}>
          <ArrowLeft color={colors.ink} size={22} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Báo cáo nội dung</Text>
          <Text style={styles.headerMeta}>Giúp cộng đồng nhận được thông tin đáng tin cậy hơn</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.notice}>
          <Flag color={colors.warning} size={21} />
          <Text style={styles.noticeText}>
            Chọn lý do chính xác nhất. Danh tính của bạn không xuất hiện trong nội dung công khai.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>LÝ DO</Text>
        <View style={styles.options}>
          {contentFlagOptions.map((option) => {
            const selected = option.value === reason;
            return (
              <Pressable
                key={option.value}
                style={({ pressed }) => [
                  styles.option,
                  selected && styles.optionSelected,
                  pressed && styles.pressed,
                ]}
                onPress={() => setReason(option.value)}
              >
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected ? <View style={styles.radioDot} /> : null}
                </View>
                <View style={styles.optionCopy}>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>
          Mô tả thêm {needsDescription ? '(bắt buộc)' : '(không bắt buộc)'}
        </Text>
        <TextInput
          multiline
          maxLength={1000}
          placeholder="Nêu chi tiết nào sai, vị trí đúng hoặc nguồn để đối chiếu…"
          style={styles.textarea}
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
        />
        <Text style={styles.counter}>{description.length}/1000</Text>

        {mutation.isError ? (
          <Text style={styles.error}>Không thể gửi yêu cầu. Hãy kiểm tra kết nối và thử lại.</Text>
        ) : null}
        <AppButton
          label="Gửi để xem xét"
          icon={<Send color={colors.onPrimary} size={18} />}
          disabled={!canSubmit || !reportId}
          loading={mutation.isPending}
          onPress={submit}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  headerCopy: { flex: 1 },
  headerTitle: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  headerMeta: { marginTop: 2, color: colors.inkMuted, fontSize: 11 },
  content: { padding: spacing.lg },
  notice: {
    flexDirection: 'row',
    gap: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.warningSoft,
    padding: spacing.lg,
  },
  noticeText: { flex: 1, color: colors.ink, fontSize: 13, lineHeight: 19 },
  sectionLabel: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  options: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  radio: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 11,
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  optionCopy: { flex: 1 },
  optionLabel: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  optionDescription: { marginTop: 2, color: colors.inkMuted, fontSize: 11, lineHeight: 16 },
  label: { marginTop: spacing.xl, color: colors.ink, fontSize: 13, fontWeight: '800' },
  textarea: {
    minHeight: 130,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
    color: colors.ink,
    fontSize: 14,
    lineHeight: 20,
  },
  counter: { marginVertical: spacing.sm, color: colors.inkMuted, fontSize: 10, textAlign: 'right' },
  error: { marginBottom: spacing.md, color: colors.danger, fontSize: 12, textAlign: 'center' },
  successScreen: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
    backgroundColor: colors.canvas,
    padding: spacing.xl,
  },
  successIcon: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
  },
  successTitle: { color: colors.ink, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  successBody: { color: colors.inkMuted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
