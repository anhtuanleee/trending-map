import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { colors, radius } from '@/theme';

type IconButtonProps = {
  accessibilityLabel: string;
  children: ReactNode;
  onPress: () => void;
  selected?: boolean;
  elevated?: boolean;
};

export function IconButton({
  accessibilityLabel,
  children,
  onPress,
  selected = false,
  elevated = false,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        selected && styles.selected,
        elevated && styles.elevated,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.mapSurfaceStrong,
  },
  selected: { backgroundColor: colors.primarySoft },
  elevated: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 7,
  },
  pressed: { opacity: 0.78, transform: [{ scale: 0.95 }] },
});
