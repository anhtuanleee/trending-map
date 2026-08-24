import { zodResolver } from '@hookform/resolvers/zod';
import { submitReportInputSchema, type SubmitReportInput } from '@trending-map/contracts';
import * as Crypto from 'expo-crypto';
import { useRouter } from 'expo-router';
import { ArrowLeft, MapPin } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSubmitReport } from '@/hooks/domain';
import { colors, radius, spacing } from '@/theme';

const categories = [
  { id: '24beceab-c7c1-407d-a0ab-b32ac358e4ec', label: 'Ngập nước' },
  { id: '70f09943-78ac-4403-9225-4cc4be183493', label: 'Ổ gà' },
  { id: '58124383-1393-4079-b125-bdbac0b5c781', label: 'Sự kiện âm nhạc' },
] as const;

export default function NewReportRoute() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { control, handleSubmit, watch, setValue, formState } = useForm<SubmitReportInput>({
    resolver: zodResolver(submitReportInputSchema),
    defaultValues: {
      type: 'incident',
      categoryId: categories[0].id,
      title: '',
      description: '',
      severity: 'medium',
      coordinate: { latitude: 10.7731, longitude: 106.7034 },
      addressLabel: 'Nguyễn Huệ, Quận 1',
      startsAt: new Date().toISOString(),
      anonymousPublicly: false,
      idempotencyKey: Crypto.randomUUID(),
    },
  });
  const mutation = useSubmitReport();
  const selectedCategory = watch('categoryId');

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <ArrowLeft color={colors.ink} size={22} />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>Báo cáo mới</Text>
          <Text style={styles.headerMeta}>Thông tin sẽ bắt đầu ở trạng thái chưa xác minh</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <Text style={styles.sectionLabel}>LOẠI BÁO CÁO</Text>
        <View style={styles.categoryGrid}>
          {categories.map((category) => (
            <Pressable
              key={category.id}
              style={[styles.category, selectedCategory === category.id && styles.categoryActive]}
              onPress={() => setValue('categoryId', category.id, { shouldValidate: true })}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextActive,
                ]}
              >
                {category.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>VỊ TRÍ</Text>
        <View style={styles.locationCard}>
          <MapPin color={colors.primary} size={21} />
          <View style={{ flex: 1 }}>
            <Text style={styles.locationTitle}>Nguyễn Huệ, Quận 1</Text>
            <Text style={styles.locationMeta}>
              Vị trí mẫu · chỉnh bằng pin trên bản đồ ở bản tiếp theo
            </Text>
          </View>
        </View>

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
              <View style={{ flex: 1 }}>
                <Text style={styles.locationTitle}>Ẩn tên công khai</Text>
                <Text style={styles.locationMeta}>Hệ thống vẫn giữ tài khoản để chống spam.</Text>
              </View>
              <Switch value={field.value} onValueChange={field.onChange} />
            </View>
          )}
        />

        <Pressable
          style={[styles.submit, mutation.isPending && styles.submitDisabled]}
          disabled={mutation.isPending}
          onPress={handleSubmit((value) =>
            mutation.mutate(value, { onSuccess: () => router.replace('/?submitted=1') }),
          )}
        >
          <Text style={styles.submitText}>{mutation.isPending ? 'Đang gửi…' : 'Đăng báo cáo'}</Text>
        </Pressable>
        {mutation.isError ? (
          <Text style={styles.error}>Không thể gửi báo cáo. Hãy thử lại.</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  header: {
    minHeight: 78,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  headerMeta: { marginTop: 2, color: colors.inkMuted, fontSize: 11 },
  content: { padding: spacing.xl, gap: spacing.lg },
  sectionLabel: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  category: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  categoryActive: { borderColor: colors.ink, backgroundColor: colors.ink },
  categoryText: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  categoryTextActive: { color: '#fff' },
  locationCard: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  locationTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  locationMeta: { marginTop: 3, color: colors.inkMuted, fontSize: 12, lineHeight: 17 },
  label: { marginBottom: spacing.sm, color: colors.ink, fontSize: 13, fontWeight: '800' },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
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
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  submit: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  error: { marginTop: spacing.xs, color: colors.danger, fontSize: 12 },
});
