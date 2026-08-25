import { tva } from '@gluestack-ui/utils/nativewind-utils';
import type { ReactNode } from 'react';
import { Pressable } from 'react-native';

// ---------------------------------------------------------------------------
// Variant definition
// ---------------------------------------------------------------------------

const iconButtonStyle = tva({
  base: 'w-12 h-12 items-center justify-center rounded-[18px] bg-map-surface-strong',
  variants: {
    selected: {
      true: 'bg-primary-soft',
      false: '',
    },
    elevated: {
      true: 'shadow-sm',
      false: '',
    },
  },
  defaultVariants: { selected: false, elevated: false },
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type IconButtonProps = {
  accessibilityLabel: string;
  children: ReactNode;
  onPress: () => void;
  selected?: boolean;
  elevated?: boolean;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

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
      className={iconButtonStyle({ selected, elevated })}
      // Acceptable exception: dynamic press animation value per gluestack-ui-v5 guidelines
      style={({ pressed }) =>
        pressed ? { opacity: 0.78, transform: [{ scale: 0.95 }] } : undefined
      }
      onPress={onPress}
    >
      {children}
    </Pressable>
  );
}
