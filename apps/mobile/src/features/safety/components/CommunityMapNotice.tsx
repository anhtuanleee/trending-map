import { Info } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

export function CommunityMapNotice() {
  return (
    <View accessibilityRole="summary" style={styles.notice}>
      <Info color={colors.warning} size={15} />
      <Text style={styles.text}>
        Báo cáo cộng đồng có thể chưa được xác minh và không thay thế thông báo của cơ quan chức
        năng.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    position: 'absolute',
    top: 232,
    alignSelf: 'center',
    maxWidth: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: radius.pill,
    backgroundColor: colors.mapSurfaceStrong,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: { flexShrink: 1, color: colors.ink, fontSize: 11, fontWeight: '700' },
});
