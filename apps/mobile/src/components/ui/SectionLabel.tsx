import { StyleSheet, Text } from 'react-native';

import { colors, spacing } from '@/theme';

export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.label}>{children.toUpperCase()}</Text>;
}

const styles = StyleSheet.create({
  label: {
    marginTop: spacing.lgPlus,
    marginBottom: spacing.sm,
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
