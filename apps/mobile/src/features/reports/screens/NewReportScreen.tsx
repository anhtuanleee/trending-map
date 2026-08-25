import { zodResolver } from '@hookform/resolvers/zod';
import {
  submitReportInputSchema,
  type Coordinate,
  type SubmitReportInput,
} from '@trending-map/contracts';
import * as Crypto from 'expo-crypto';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { useAuthGate } from '@/features/auth';
import { formatCoordinate } from '@/lib/format';
import { colors } from '@/theme';

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
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <View className="min-h-[78px] flex-row items-center gap-3 border-b border-border bg-surface px-4">
        <Pressable
          accessibilityLabel="Quay lại"
          className="h-[42px] w-[42px] items-center justify-center"
          onPress={() => router.back()}
        >
          <ArrowLeft color={colors.ink} size={22} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-black text-ink">Báo cáo mới</Text>
          <Text className="mt-0.5 text-[11px] text-muted">
            Thông tin sẽ bắt đầu ở trạng thái chưa xác minh
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View className="gap-4 p-6">
          <Text className="text-[11px] font-black text-primary">LOẠI BÁO CÁO</Text>
          <View className="flex-row flex-wrap gap-2">
            {reportCategories.map((category) => (
              <Pressable
                key={category.id}
                className={`min-h-11 justify-center rounded-pill border px-4 ${selectedCategory === category.id ? 'border-ink bg-ink' : 'border-border bg-surface'}`}
                onPress={() => setValue('categoryId', category.id, { shouldValidate: true })}
              >
                <Text
                  className={`text-[13px] font-bold ${selectedCategory === category.id ? 'text-white' : 'text-ink'}`}
                >
                  {category.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-[11px] font-black text-primary">VỊ TRÍ</Text>
          <Pressable
            className="min-h-20 flex-row items-center gap-3 rounded-md bg-surface p-4 active:bg-primary-soft"
            onPress={() => setLocationPickerVisible(true)}
          >
            <View className="h-[42px] w-[42px] items-center justify-center rounded-full bg-canvas">
              <MapPin color={colors.primary} size={21} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-extrabold text-ink">
                {selectedLocation?.addressLabel ?? 'Chọn vị trí hiện trường'}
              </Text>
              <Text className="mt-[3px] text-xs leading-[17px] text-muted">
                {selectedLocation
                  ? formatCoordinate(selectedLocation.coordinate)
                  : 'Kéo pin trên bản đồ hoặc dùng GPS hiện tại'}
              </Text>
            </View>
            <ChevronRight color={colors.inkMuted} size={20} />
          </Pressable>
          {formState.errors.coordinate ? (
            <Text className="mt-1 text-xs text-danger">Chọn vị trí trước khi đăng báo cáo.</Text>
          ) : null}

          <Controller
            control={control}
            name="title"
            render={({ field }) => (
              <View>
                <Text className="mb-2 text-[13px] font-extrabold text-ink">Tiêu đề</Text>
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Ví dụ: Ngập sâu, xe máy khó đi"
                  className="min-h-[52px] rounded-md border border-border bg-surface px-4 text-[15px] text-ink"
                  placeholderTextColor={colors.inkMuted}
                />
                {formState.errors.title ? (
                  <Text className="mt-1 text-xs text-danger">{formState.errors.title.message}</Text>
                ) : null}
              </View>
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <View>
                <Text className="mb-2 text-[13px] font-extrabold text-ink">Mô tả hiện trường</Text>
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  multiline
                  placeholder="Điều gì đang xảy ra? Ai hoặc phương tiện nào bị ảnh hưởng?"
                  className="min-h-[120px] rounded-md border border-border bg-surface px-4 pt-4 text-[15px] text-ink"
                  placeholderTextColor={colors.inkMuted}
                  textAlignVertical="top"
                />
                {formState.errors.description ? (
                  <Text className="mt-1 text-xs text-danger">
                    {formState.errors.description.message}
                  </Text>
                ) : null}
              </View>
            )}
          />

          <Controller
            control={control}
            name="anonymousPublicly"
            render={({ field }) => (
              <View className="min-h-[74px] flex-row items-center gap-4 rounded-md bg-surface p-4">
                <View className="flex-1">
                  <Text className="text-sm font-extrabold text-ink">Ẩn tên công khai</Text>
                  <Text className="mt-[3px] text-xs leading-[17px] text-muted">
                    Hệ thống vẫn giữ tài khoản để chống spam.
                  </Text>
                </View>
                <Switch value={field.value} onValueChange={field.onChange} />
              </View>
            )}
          />

          <Button
            className="min-h-14"
            disabled={mutation.isPending}
            loading={mutation.isPending}
            onPress={() => void submit()}
          >
            {mutation.isPending ? 'Đang gửi…' : 'Đăng báo cáo'}
          </Button>
          {mutation.isError ? (
            <Text className="mt-1 text-xs text-danger">Không thể gửi báo cáo. Hãy thử lại.</Text>
          ) : null}
        </View>
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
