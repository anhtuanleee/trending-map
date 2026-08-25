import type { VerificationStatus } from '@trending-map/contracts';
import { BadgeCheck, CircleAlert, CircleDashed, UsersRound } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

const labels: Record<VerificationStatus, string> = {
  unverified: 'Chưa xác minh',
  community_verified: 'Cộng đồng xác nhận',
  official_verified: 'Nguồn chính thức',
  disputed: 'Đang tranh luận',
};

const tones = {
  unverified: { background: colors.surfaceMuted, foreground: colors.inkMuted, Icon: CircleDashed },
  community_verified: {
    background: colors.primarySoft,
    foreground: colors.primary,
    Icon: UsersRound,
  },
  official_verified: {
    background: colors.officialSoft,
    foreground: colors.official,
    Icon: BadgeCheck,
  },
  disputed: { background: colors.warningSoft, foreground: colors.warning, Icon: CircleAlert },
} as const;

export function StatusBadge({ status }: { status: VerificationStatus }) {
  const tone = tones[status];
  const Icon = tone.Icon;

  return (
    <View style={[styles.badge, { backgroundColor: tone.background }]}>
      <Icon color={tone.foreground} size={13} strokeWidth={2.5} />
      <Text style={[styles.text, { color: tone.foreground }]}>{labels[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  text: { fontSize: 11, fontWeight: '800' },
});
