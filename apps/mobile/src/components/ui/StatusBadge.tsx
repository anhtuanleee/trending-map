import type { VerificationStatus } from '@trending-map/contracts';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

const labels: Record<VerificationStatus, string> = {
  unverified: 'Chưa xác minh',
  community_verified: 'Cộng đồng xác nhận',
  official_verified: 'Nguồn chính thức',
  disputed: 'Đang tranh luận',
};

export function StatusBadge({ status }: { status: VerificationStatus }) {
  return (
    <View style={[styles.badge, status === 'official_verified' && styles.official]}>
      <Text style={[styles.text, status === 'official_verified' && styles.officialText]}>
        {labels[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  official: { backgroundColor: colors.officialSoft },
  text: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  officialText: { color: colors.official },
});
