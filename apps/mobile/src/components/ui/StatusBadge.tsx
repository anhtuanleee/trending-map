import type { VerificationStatus } from '@trending-map/contracts';
import { Text, View } from 'react-native';

const labels: Record<VerificationStatus, string> = {
  unverified: 'Chưa xác minh',
  community_verified: 'Cộng đồng xác nhận',
  official_verified: 'Nguồn chính thức',
  disputed: 'Đang tranh luận',
};

export function StatusBadge({ status }: { status: VerificationStatus }) {
  return (
    <View
      className={`self-start rounded-pill px-3 py-1.5 ${status === 'official_verified' ? 'bg-official-soft' : 'bg-primary-soft'}`}
    >
      <Text
        className={`text-xs font-bold ${status === 'official_verified' ? 'text-official' : 'text-primary'}`}
      >
        {labels[status]}
      </Text>
    </View>
  );
}
