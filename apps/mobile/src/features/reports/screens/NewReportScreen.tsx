import { zodResolver } from '@hookform/resolvers/zod';
import {
  submitReportInputSchema,
  type Coordinate,
  type LocalReportImage,
  type SubmitReportInput,
} from '@trending-map/contracts';
import * as Crypto from 'expo-crypto';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Car,
  ChevronRight,
  Construction,
  Droplets,
  Info,
  MapPin,
  Music2,
  Send,
  ShieldAlert,
  ShieldCheck,
  Trees,
  Trophy,
  Users,
  Zap,
} from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, SectionLabel } from '@/components/ui';
import { useAuthGate } from '@/features/auth';
import { useFeatureRollout } from '@/features/feature-rollouts';
import { formatCoordinate } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';

import { PhotoEvidencePicker } from '../components/PhotoEvidencePicker';
import { ReportLocationPicker } from '../components/ReportLocationPicker';
import { useSubmitReport } from '../hooks/useSubmitReport';
import { useUploadReportEvidence } from '../hooks/useUploadReportEvidence';
import {
  LEGAL_DISCLAIMER,
  reportCategories,
  reportCategoryGroups,
  SAFETY_GUIDELINES,
  validateSafeReportContent,
  type ReportCategoryGroup,
} from '../model/report-form.config';

type SelectedLocation = {
  coordinate: Coordinate;
  addressLabel: string;
};

const categoryIconMap = {
  Droplets,
  Construction,
  Trees,
  Zap,
  Car,
  Music2,
  Calendar,
  Trophy,
  Users,
} as const;

export function NewReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const requireAuth = useAuthGate();
  const [selectedGroup, setSelectedGroup] =
    useState<ReportCategoryGroup>('infrastructure_disaster');
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [evidenceImages, setEvidenceImages] = useState<LocalReportImage[]>([]);

  const { control, handleSubmit, watch, setValue, formState } = useForm<SubmitReportInput>({
    resolver: zodResolver(submitReportInputSchema),
    defaultValues: {
      type: 'incident',
      categoryId: reportCategories[0].id,
      title: '',
      description: '',
      severity: 'medium',
      startsAt: new Date().toISOString(),
      anonymousPublicly: false,
      idempotencyKey: Crypto.randomUUID(),
    },
  });

  const mutation = useSubmitReport();
  const evidenceUpload = useUploadReportEvidence();
  const evidenceRollout = useFeatureRollout('photo_evidence_upload');

  const selectedCategoryId = watch('categoryId');
  const titleValue = watch('title') ?? '';
  const descriptionValue = watch('description') ?? '';

  // Real-time content safety check
  const safetyCheck = validateSafeReportContent(titleValue, descriptionValue);

  const filteredCategories = reportCategories.filter((cat) => cat.group === selectedGroup);

  const handleLocationSelect = (location: SelectedLocation) => {
    setSelectedLocation(location);
    setValue('coordinate', location.coordinate, { shouldDirty: true, shouldValidate: true });
    setValue('addressLabel', location.addressLabel, { shouldDirty: true, shouldValidate: true });
  };

  const submit = handleSubmit((value) => {
    // Block submission if prohibited content detected
    if (!safetyCheck.safe) {
      return;
    }

    requireAuth(
      '/report/new',
      () => {
        void (async () => {
          try {
            const report = await mutation.mutateAsync(value);
            if (evidenceRollout.enabled && evidenceImages.length > 0) {
              await evidenceUpload.mutateAsync({ reportId: report.id, images: evidenceImages });
            }
            router.replace('/?submitted=1');
          } catch {
            // Mutation error state handled in UI
          }
        })();
      },
      'Đăng nhập để đăng báo cáo',
    );
  });

  const submitting = mutation.isPending || evidenceUpload.isPending;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Quay lại" style={styles.back} onPress={() => router.back()}>
          <ArrowLeft color={colors.ink} size={22} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Báo cáo hiện trường</Text>
          <Text style={styles.headerMeta}>Thông tin thực tế quan sát được</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        {/* Legal Disclaimer & Safety Notice */}
        <View style={styles.disclaimerBanner}>
          <View style={styles.disclaimerTop}>
            <ShieldCheck color={colors.primary} size={18} />
            <Text style={styles.disclaimerTitle}>QUY ĐỊNH BÁO CÁO AN TOÀN</Text>
          </View>
          <Text style={styles.disclaimerText}>{LEGAL_DISCLAIMER}</Text>
          <Pressable
            style={styles.guidelinesToggle}
            onPress={() => setShowGuidelines(!showGuidelines)}
          >
            <Text style={styles.guidelinesToggleText}>
              {showGuidelines ? 'Ẩn quy tắc cộng đồng' : 'Xem các chủ đề nghiêm cấm'}
            </Text>
            <Info color={colors.primary} size={14} />
          </Pressable>

          {showGuidelines ? (
            <View style={styles.guidelinesCard}>
              <Text style={styles.guidelinesHeader}>Nguyên tắc tuân thủ pháp luật:</Text>
              {SAFETY_GUIDELINES.map((guide, idx) => (
                <View key={idx} style={styles.guideRow}>
                  <Text style={styles.guideBullet}>•</Text>
                  <Text style={styles.guideText}>{guide}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* Content Safety Live Warning */}
        {!safetyCheck.safe ? (
          <View style={styles.warningCard}>
            <ShieldAlert color={colors.danger} size={20} />
            <View style={styles.warningCopy}>
              <Text style={styles.warningTitle}>Phát hiện nội dung không an toàn</Text>
              <Text style={styles.warningText}>{safetyCheck.warning}</Text>
            </View>
          </View>
        ) : null}

        {/* Category Group Switcher */}
        <SectionLabel>Nhóm chủ đề</SectionLabel>
        <View style={styles.groupTabs}>
          {(Object.keys(reportCategoryGroups) as ReportCategoryGroup[]).map((groupKey) => {
            const groupInfo = reportCategoryGroups[groupKey];
            const active = selectedGroup === groupKey;
            return (
              <Pressable
                key={groupKey}
                style={[styles.groupTab, active && styles.groupTabActive]}
                onPress={() => {
                  setSelectedGroup(groupKey);
                  const firstInGroup = reportCategories.find((c) => c.group === groupKey);
                  if (firstInGroup) {
                    setValue('categoryId', firstInGroup.id, { shouldValidate: true });
                    setValue('type', firstInGroup.type, { shouldValidate: true });
                  }
                }}
              >
                <Text style={[styles.groupTabLabel, active && styles.groupTabLabelActive]}>
                  {groupInfo.label}
                </Text>
                <Text style={[styles.groupTabBadge, active && styles.groupTabBadgeActive]}>
                  {groupInfo.priorityLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Category Selection Grid */}
        <SectionLabel>Loại hiện trường cụ thể</SectionLabel>
        <View style={styles.categoryGrid}>
          {filteredCategories.map((category) => {
            const IconComponent = categoryIconMap[category.iconName] ?? Droplets;
            const active = selectedCategoryId === category.id;
            return (
              <Pressable
                key={category.id}
                style={({ pressed }) => [
                  styles.category,
                  active && styles.categoryActive,
                  pressed && styles.pressed,
                ]}
                onPress={() => {
                  setValue('categoryId', category.id, { shouldValidate: true });
                  setValue('type', category.type, { shouldValidate: true });
                }}
              >
                <View
                  style={[
                    styles.categoryIcon,
                    active ? styles.categoryIconActive : styles.categoryIconInactive,
                  ]}
                >
                  <IconComponent color={active ? colors.primary : colors.inkMuted} size={22} />
                </View>
                <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                  {category.label}
                </Text>
                <Text style={styles.categorySubtext} numberOfLines={2}>
                  {category.description}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* GPS Location Selection */}
        <SectionLabel>Vị trí hiện trường (GPS)</SectionLabel>
        <Pressable
          style={({ pressed }) => [styles.locationCard, pressed && styles.pressed]}
          onPress={() => setLocationPickerVisible(true)}
        >
          <View style={styles.locationIcon}>
            <MapPin color={colors.primary} size={21} />
          </View>
          <View style={styles.locationCopy}>
            <Text style={styles.locationTitle}>
              {selectedLocation?.addressLabel ?? 'Chọn vị trí hiện trường'}
            </Text>
            <Text style={styles.locationMeta}>
              {selectedLocation
                ? formatCoordinate(selectedLocation.coordinate)
                : 'Bắt buộc: Kéo pin trên bản đồ hoặc dùng GPS hiện tại'}
            </Text>
          </View>
          <ChevronRight color={colors.inkMuted} size={20} />
        </Pressable>
        {formState.errors.coordinate ? (
          <Text style={styles.error}>Bắt buộc chọn vị trí trước khi đăng báo cáo.</Text>
        ) : null}

        {/* Title input */}
        <Controller
          control={control}
          name="title"
          render={({ field }) => (
            <View>
              <Text style={styles.label}>Tiêu đề (Khách quan, ngắn gọn)</Text>
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="Ví dụ: Nước ngập ngang bánh xe, cây đổ chắn nửa đường"
                style={styles.input}
              />
              {formState.errors.title ? (
                <Text style={styles.error}>{formState.errors.title.message}</Text>
              ) : null}
            </View>
          )}
        />

        {/* Photo evidence upload */}
        {evidenceRollout.enabled ? (
          <View style={styles.evidenceSection}>
            <SectionLabel>Ảnh bằng chứng hiện trường</SectionLabel>
            <Text style={styles.fieldHelper}>
              Ảnh thực tế giúp báo cáo được kiểm duyệt và cộng đồng tin cậy nhanh hơn.
            </Text>
            <PhotoEvidencePicker
              images={evidenceImages}
              disabled={submitting}
              onChange={setEvidenceImages}
            />
          </View>
        ) : null}

        {/* Description textarea */}
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <View>
              <Text style={styles.label}>Mô tả chi tiết hiện trường</Text>
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                multiline
                placeholder="Mô tả khách quan: Mực nước, tình hình xe cộ, hướng di chuyển thuận tiện..."
                style={[styles.input, styles.textarea]}
              />
              {formState.errors.description ? (
                <Text style={styles.error}>{formState.errors.description.message}</Text>
              ) : null}
            </View>
          )}
        />

        {/* Anonymous switch */}
        <Controller
          control={control}
          name="anonymousPublicly"
          render={({ field }) => (
            <View style={styles.switchRow}>
              <View style={styles.locationCopy}>
                <Text style={styles.locationTitle}>Ẩn tên công khai</Text>
                <Text style={styles.locationMeta}>
                  Hệ thống vẫn lưu tài khoản và nhật ký gửi để chống spam & phục vụ kiểm duyệt.
                </Text>
              </View>
              <Switch value={field.value} onValueChange={field.onChange} />
            </View>
          )}
        />

        {/* Legal audit note */}
        <View style={styles.legalNotice}>
          <Text style={styles.legalNoticeText}>
            🛡️ Báo cáo sẽ được kiểm duyệt trước khi hiển thị rộng rãi. Mọi thông tin gửi đi được lưu
            nhật ký phục vụ bảo vệ an toàn cộng đồng.
          </Text>
        </View>

        {/* Submit button */}
        <AppButton
          label={
            evidenceUpload.isPending
              ? 'Đang tải ảnh…'
              : submitting
                ? 'Đang gửi…'
                : 'Đăng báo cáo an toàn'
          }
          icon={<Send color={colors.accentInk} size={18} />}
          tone="accent"
          disabled={!safetyCheck.safe || submitting}
          loading={submitting}
          onPress={() => void submit()}
        />

        {mutation.isError ? (
          <Text style={styles.error}>Không thể gửi báo cáo. Hãy thử lại.</Text>
        ) : null}
        {evidenceUpload.isError ? (
          <Text style={styles.error}>
            Báo cáo đã được lưu nhưng chưa tải đủ ảnh. Bấm đăng lại để tiếp tục an toàn.
          </Text>
        ) : null}
      </ScrollView>

      <ReportLocationPicker
        visible={locationPickerVisible}
        initialCoordinate={selectedLocation?.coordinate}
        onClose={() => setLocationPickerVisible(false)}
        onSelect={handleLocationSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  header: {
    minHeight: 76,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
  },
  headerCopy: { flex: 1 },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  headerTitle: { color: colors.ink, fontSize: 19, fontWeight: '800' },
  headerMeta: { marginTop: 2, color: colors.inkMuted, fontSize: 11, fontWeight: '500' },
  content: { padding: spacing.xl },
  disclaimerBanner: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  disclaimerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  disclaimerTitle: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  disclaimerText: {
    color: colors.inkMuted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  guidelinesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  guidelinesToggleText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  guidelinesCard: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  guidelinesHeader: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginBottom: 4,
  },
  guideBullet: { color: colors.danger, fontSize: 12, fontWeight: '800' },
  guideText: { flex: 1, color: colors.inkMuted, fontSize: 11, lineHeight: 16 },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  warningCopy: { flex: 1 },
  warningTitle: { color: colors.danger, fontSize: 13, fontWeight: '800' },
  warningText: { color: colors.danger, fontSize: 12, lineHeight: 17, marginTop: 2 },
  groupTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  groupTab: {
    flex: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  groupTabActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  groupTabLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  groupTabLabelActive: {
    color: colors.primary,
  },
  groupTabBadge: {
    color: colors.inkMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  groupTabBadgeActive: {
    color: colors.primary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  category: {
    width: '48%',
    minHeight: 110,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  categoryActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  categoryIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  categoryIconInactive: {
    backgroundColor: colors.surfaceMuted,
  },
  categoryIconActive: {
    backgroundColor: colors.surface,
  },
  categoryText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  categoryTextActive: {
    color: colors.primary,
  },
  categorySubtext: {
    color: colors.inkMuted,
    fontSize: 10,
    lineHeight: 14,
  },
  locationCard: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  locationIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  locationCopy: { flex: 1 },
  locationTitle: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  locationMeta: { marginTop: 2, color: colors.inkMuted, fontSize: 11, lineHeight: 16 },
  label: {
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  fieldHelper: {
    color: colors.inkMuted,
    fontSize: 11,
    marginBottom: spacing.sm,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    color: colors.ink,
    paddingHorizontal: spacing.md,
    fontSize: 14,
  },
  textarea: { minHeight: 100, paddingTop: spacing.md, textAlignVertical: 'top' },
  switchRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  evidenceSection: { marginTop: spacing.md },
  legalNotice: {
    marginVertical: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  legalNoticeText: {
    color: colors.inkMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  error: { marginTop: spacing.xs, color: colors.danger, fontSize: 12 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
});
