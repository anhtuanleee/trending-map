import { tva } from '@gluestack-ui/utils/nativewind-utils';
import type { VerificationStatus } from '@trending-map/contracts';
import { BadgeCheck, CircleAlert, CircleDashed, UsersRound } from 'lucide-react-native';
import { Text, View } from 'react-native';

// ---------------------------------------------------------------------------
// Variant definitions
// ---------------------------------------------------------------------------

const badgeStyle = tva({
  base: 'self-start flex-row items-center gap-[5px] rounded-full px-3 py-[6px]',
  variants: {
    status: {
      unverified: 'bg-surface-muted',
      community_verified: 'bg-primary-soft',
      official_verified: 'bg-official-soft',
      disputed: 'bg-warning-soft',
    },
  },
});

const badgeTextStyle = tva({
  base: 'text-[11px] font-extrabold',
  variants: {
    status: {
      unverified: 'text-ink-muted',
      community_verified: 'text-primary',
      official_verified: 'text-official',
      disputed: 'text-warning',
    },
  },
});

// ---------------------------------------------------------------------------
// Icon + label maps (no hardcoded colors — icon color provided via token hex)
// ---------------------------------------------------------------------------

const icons = {
  unverified: CircleDashed,
  community_verified: UsersRound,
  official_verified: BadgeCheck,
  disputed: CircleAlert,
} as const;

const labels: Record<VerificationStatus, string> = {
  unverified: 'Chưa xác minh',
  community_verified: 'Cộng đồng xác nhận',
  official_verified: 'Nguồn chính thức',
  disputed: 'Đang tranh luận',
};

// lucide-react-native doesn't accept className — use raw hex matching token values
const iconColors: Record<VerificationStatus, string> = {
  unverified: '#60736d',
  community_verified: '#0aa77a',
  official_verified: '#496cf2',
  disputed: '#ff8a3d',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StatusBadge({ status }: { status: VerificationStatus }) {
  const Icon = icons[status];

  return (
    <View className={badgeStyle({ status })}>
      <Icon color={iconColors[status]} size={13} strokeWidth={2.5} />
      <Text className={badgeTextStyle({ status })}>{labels[status]}</Text>
    </View>
  );
}
