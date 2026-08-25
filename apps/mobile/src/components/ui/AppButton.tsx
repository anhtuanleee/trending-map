import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing } from '@/theme';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  tone?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
  size?: 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
};

export function AppButton({
  label,
  onPress,
  icon,
  tone = 'primary',
  size = 'large',
  disabled = false,
  loading = false,
}: AppButtonProps) {
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        styles[tone],
        styles[size],
        pressed && !inactive && styles.pressed,
        inactive && styles.disabled,
      ]}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color={tone === 'accent' ? colors.accentInk : colors.onPrimary} />
      ) : (
        icon
      )}
      <Text style={[styles.label, styles[`${tone}Label`]]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
  medium: { minHeight: 48 },
  large: { minHeight: 56 },
  primary: { backgroundColor: colors.primary },
  secondary: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  accent: { backgroundColor: colors.accent },
  ghost: { backgroundColor: colors.surfaceMuted },
  danger: { backgroundColor: colors.dangerSoft },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.48 },
  label: { fontSize: 15, fontWeight: '800' },
  primaryLabel: { color: colors.onPrimary },
  secondaryLabel: { color: colors.ink },
  accentLabel: { color: colors.accentInk },
  ghostLabel: { color: colors.ink },
  dangerLabel: { color: colors.danger },
});
