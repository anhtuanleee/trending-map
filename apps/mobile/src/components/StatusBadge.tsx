import type { VerificationStatus } from '@trending-map/contracts';
import { colors, radius, spacing } from '@trending-map/ui-tokens';
import { StyleSheet, Text, View } from 'react-native';

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
    backgroundColor: '#e7f2ed',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  official: { backgroundColor: '#e8eef9' },
  text: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  officialText: { color: colors.official },
});
