import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Clock3, MapPin, X } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StatusBadge } from '@/components/ui';
import { useAuthGate } from '@/features/auth';
import { colors, spacing } from '@/theme';

import { useConfirmReport, useReport } from '../hooks/useReport';

export function ReportDetailScreen({ id }: { id: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const requireAuth = useAuthGate();
  const reportQuery = useReport(id);
  const confirmation = useConfirmReport(id);

  const handleConfirmation = (kind: 'seen' | 'not_there') => {
    requireAuth(`/report/${id}`, () => confirmation.mutate(kind), 'Đăng nhập để xác nhận');
  };

  const report = reportQuery.data;
  if (!report) {
    return (
      <View
        className="flex-1 items-center justify-center bg-canvas"
        style={{ paddingTop: insets.top }}
      >
        <Text className="mt-2 text-base leading-[25px] text-muted">
          {reportQuery.isLoading ? 'Đang tải…' : 'Không tìm thấy báo cáo.'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-canvas"
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
    >
      <View
        className="min-h-[260px] bg-primary-subtle px-4"
        style={{ paddingTop: insets.top + spacing.md }}
      >
        <Pressable
          className="h-11 w-11 items-center justify-center rounded-full bg-surface"
          onPress={() => router.back()}
        >
          <ArrowLeft color={colors.ink} size={22} />
        </Pressable>
        <Text className="mt-[30px] text-center text-[72px] font-black text-primary">
          {report.categorySlug === 'music' ? '♪' : '!'}
        </Text>
        <Text className="text-center text-xs font-black text-primary">
          {report.categoryName.toUpperCase()}
        </Text>
      </View>

      <View className="p-6">
        <StatusBadge status={report.verificationStatus} />
        <Text className="mt-3 text-[28px] font-black leading-[34px] text-ink">{report.title}</Text>
        <View className="mt-3 flex-row items-center gap-2">
          <MapPin color={colors.inkMuted} size={17} />
          <Text className="flex-1 text-sm text-muted">{report.addressLabel}</Text>
        </View>
        <View className="mt-3 flex-row items-center gap-2">
          <Clock3 color={colors.inkMuted} size={17} />
          <Text className="flex-1 text-sm text-muted">
            {report.confirmationCount} người đã xác nhận
          </Text>
        </View>
        <View className="my-6 h-px bg-border" />
        <Text className="text-[11px] font-black text-primary">THÔNG TIN HIỆN TRƯỜNG</Text>
        <Text className="mt-2 text-base leading-[25px] text-muted">{report.description}</Text>

        <View className="mt-6 flex-row gap-2">
          <Pressable
            className={`min-h-[52px] flex-1 flex-row items-center justify-center gap-2 rounded-md bg-primary ${confirmation.isPending ? 'opacity-60' : 'active:bg-primary-pressed'}`}
            disabled={confirmation.isPending}
            onPress={() => handleConfirmation('seen')}
          >
            <Check color={colors.onPrimary} size={18} />
            <Text className="font-black text-white">Tôi cũng thấy</Text>
          </Pressable>
          <Pressable
            className={`min-h-[52px] flex-1 flex-row items-center justify-center gap-2 rounded-md border border-border bg-surface ${confirmation.isPending ? 'opacity-60' : 'active:bg-canvas'}`}
            disabled={confirmation.isPending}
            onPress={() => handleConfirmation('not_there')}
          >
            <X color={colors.ink} size={18} />
            <Text className="font-extrabold text-ink">Không còn</Text>
          </Pressable>
        </View>
        {confirmation.isSuccess ? (
          <Text className="mt-3 text-center text-primary">Cảm ơn bạn đã xác nhận.</Text>
        ) : null}
        {confirmation.isError ? (
          <Text className="mt-3 text-center text-danger">Không thể gửi xác nhận.</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}
