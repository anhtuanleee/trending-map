import { zodResolver } from '@hookform/resolvers/zod';
import {
  submitReportInputSchema,
  type Coordinate,
  type SubmitReportInput,
} from '@trending-map/contracts';
import * as Crypto from 'expo-crypto';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ChevronRight,
  Construction,
  Droplets,
  MapPin,
  Music2,
  Send,
} from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, SectionLabel } from '@/components/ui';
import { useAuthGate } from '@/features/auth';
import { formatCoordinate } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';

import { ReportLocationPicker } from '../components/ReportLocationPicker';
import { useSubmitReport } from '../hooks/useSubmitReport';
import { reportCategories } from '../model/report-form.config';

type SelectedLocation = {
  coordinate: Coordinate;
  addressLabel: string;
};

export function NewReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const requireAuth = useAuthGate();
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
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
  const selectedCategory = watch('categoryId');
  const categoryVisuals = [
    { Icon: Droplets, color: colors.weather, background: colors.infoSoft },
    { Icon: Construction, color: colors.traffic, background: colors.warningSoft },
    { Icon: Music2, color: colors.event, background: colors.officialSoft },
  ] as const;

  const handleLocationSelect = (location: SelectedLocation) => {
    setSelectedLocation(location);
    setValue('coordinate', location.coordinate, { shouldDirty: true, shouldValidate: true });
    setValue('addressLabel', location.addressLabel, { shouldDirty: true, shouldValidate: true });
  };

  const submit = handleSubmit((value) => {
    requireAuth(
      '/report/new',
      () => mutation.mutate(value, { onSuccess: () => router.replace('/?submitted=1') }),
      'Đăng nhập để đăng báo cáo',
    );
  });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Quay lại" style={styles.back} onPress={() => router.back()}>
          <ArrowLeft color={colors.ink} size={22} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Báo cáo mới</Text>
          <Text style={styles.headerMeta}>Chia sẻ tín hiệu hữu ích cho cộng đồng</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.progressCard}>
          <View style={styles.progressTop}>
            <Text style={styles.progressEyebrow}>TÍN HIỆU MỚI</Text>
            <Text style={styles.progressMeta}>Khoảng 1 phút</Text>
          </View>
          <Text style={styles.progressTitle}>Điều gì đang diễn ra?</Text>
          <Text style={styles.progressDescription}>
            Chọn đúng loại để người ở gần nhận biết tình hình nhanh hơn.
          </Text>
        </View>

        <SectionLabel>Loại báo cáo</SectionLabel>
        <View style={styles.categoryGrid}>
          {reportCategories.map((category, index) => {
            const visual = categoryVisuals[index];
            const active = selectedCategory === category.id;
            return (
              <Pressable
                key={category.id}
                style={({ pressed }) => [
                  styles.category,
                  active && styles.categoryActive,
                  pressed && styles.pressed,
                ]}
                onPress={() => setValue('categoryId', category.id, { shouldValidate: true })}
              >
                <View style={[styles.categoryIcon, { backgroundColor: visual.background }]}>
                  <visual.Icon color={visual.color} size={21} />
                </View>
                <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                  {category.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <SectionLabel>Vị trí</SectionLabel>
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
                : 'Kéo pin trên bản đồ hoặc dùng GPS hiện tại'}
            </Text>
          </View>
          <ChevronRight color={colors.inkMuted} size={20} />
        </Pressable>
        {formState.errors.coordinate ? (
          <Text style={styles.error}>Chọn vị trí trước khi đăng báo cáo.</Text>
        ) : null}

        <Controller
          control={control}
          name="title"
          render={({ field }) => (
            <View>
              <Text style={styles.label}>Tiêu đề</Text>
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="Ví dụ: Ngập sâu, xe máy khó đi"
                style={styles.input}
              />
              {formState.errors.title ? (
                <Text style={styles.error}>{formState.errors.title.message}</Text>
              ) : null}
            </View>
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <View>
              <Text style={styles.label}>Mô tả hiện trường</Text>
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                multiline
                placeholder="Điều gì đang xảy ra? Ai hoặc phương tiện nào bị ảnh hưởng?"
                style={[styles.input, styles.textarea]}
              />
              {formState.errors.description ? (
                <Text style={styles.error}>{formState.errors.description.message}</Text>
              ) : null}
            </View>
          )}
        />

        <Controller
          control={control}
          name="anonymousPublicly"
          render={({ field }) => (
            <View style={styles.switchRow}>
              <View style={styles.locationCopy}>
                <Text style={styles.locationTitle}>Ẩn tên công khai</Text>
                <Text style={styles.locationMeta}>Hệ thống vẫn giữ tài khoản để chống spam.</Text>
              </View>
              <Switch value={field.value} onValueChange={field.onChange} />
            </View>
          )}
        />

        <AppButton
          label={mutation.isPending ? 'Đang gửi…' : 'Đăng báo cáo'}
          icon={<Send color={colors.accentInk} size={18} />}
          tone="accent"
          loading={mutation.isPending}
          onPress={() => void submit()}
        />
        {mutation.isError ? (
          <Text style={styles.error}>Không thể gửi báo cáo. Hãy thử lại.</Text>
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
  progressCard: {
    overflow: 'hidden',
    borderRadius: radius.xl,
    backgroundColor: colors.ink,
    padding: spacing.xl,
  },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between' },
  progressEyebrow: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  progressMeta: { color: colors.onPrimary, fontSize: 11, opacity: 0.7 },
  progressTitle: {
    marginTop: spacing.xl,
    color: colors.onPrimary,
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  progressDescription: {
    marginTop: spacing.sm,
    color: colors.onPrimary,
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.72,
  },
  categoryGrid: { flexDirection: 'row', gap: spacing.sm },
  category: {
    flex: 1,
    minHeight: 108,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.sm,
  },
  categoryActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  categoryIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  categoryText: { color: colors.ink, fontSize: 11, textAlign: 'center', fontWeight: '700' },
  categoryTextActive: { color: colors.primary },
  locationCard: {
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  locationIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  locationCopy: { flex: 1 },
  locationTitle: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  locationMeta: { marginTop: 3, color: colors.inkMuted, fontSize: 12, lineHeight: 17 },
  label: {
    marginTop: spacing.lgPlus,
    marginBottom: spacing.sm,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    color: colors.ink,
    paddingHorizontal: spacing.lg,
    fontSize: 15,
  },
  textarea: { minHeight: 120, paddingTop: spacing.lg, textAlignVertical: 'top' },
  switchRow: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.lgPlus,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  error: { marginTop: spacing.xs, color: colors.danger, fontSize: 12 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
});
