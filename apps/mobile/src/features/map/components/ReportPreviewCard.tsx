import type { MapItem } from '@trending-map/contracts';
import { Check, Clock3, MapPin, X } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { StatusBadge } from '@/components/ui';
import { colors } from '@/theme';

type Props = {
  report: MapItem;
  onClose: () => void;
  onConfirm: () => void;
};

export function ReportPreviewCard({ report, onClose, onConfirm }: Props) {
  return (
    <View className="absolute bottom-[100px] left-4 right-4 rounded-card bg-surface p-4 shadow-2xl">
      <View className="flex-row items-center justify-between">
        <StatusBadge status={report.verificationStatus} />
        <Pressable
          accessibilityLabel="Đóng chi tiết"
          className="active:opacity-60"
          hitSlop={12}
          onPress={onClose}
        >
          <X color={colors.inkMuted} size={20} />
        </Pressable>
      </View>
      <Text className="mt-3 text-xs font-extrabold text-primary">{report.categoryName}</Text>
      <Text className="mt-1 text-xl font-extrabold text-ink">{report.title}</Text>
      <View className="mt-2 flex-row items-center gap-1.5">
        <MapPin color={colors.inkMuted} size={15} />
        <Text className="flex-1 text-[13px] text-muted">Gần vị trí này</Text>
      </View>
      <View className="mt-2 flex-row items-center gap-1.5">
        <Clock3 color={colors.inkMuted} size={15} />
        <Text className="flex-1 text-[13px] text-muted">
          Cập nhật gần đây · {report.confirmationCount} xác nhận
        </Text>
      </View>
      <Pressable
        className="mt-4 min-h-12 flex-row items-center justify-center gap-2 rounded-xl bg-primary active:opacity-80"
        onPress={onConfirm}
      >
        <Check color={colors.onPrimary} size={18} />
        <Text className="text-[15px] font-extrabold text-white">Tôi cũng thấy</Text>
      </Pressable>
    </View>
  );
}
