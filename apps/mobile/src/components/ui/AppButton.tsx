import { tva } from '@gluestack-ui/utils/nativewind-utils';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

// ---------------------------------------------------------------------------
// Variant definitions
// ---------------------------------------------------------------------------

const buttonStyle = tva({
  base: 'flex-row items-center justify-center gap-2 rounded-[18px] px-6',
  variants: {
    tone: {
      primary: 'bg-primary',
      secondary: 'border border-border bg-surface',
      accent: 'bg-accent',
      ghost: 'bg-surface-muted',
      danger: 'bg-danger-soft',
    },
    size: {
      medium: 'min-h-[48px]',
      large: 'min-h-[56px]',
    },
    inactive: {
      true: 'opacity-50',
      false: '',
    },
  },
  defaultVariants: { tone: 'primary', size: 'large', inactive: false },
});

const labelStyle = tva({
  base: 'text-[15px] font-extrabold',
  variants: {
    tone: {
      primary: 'text-on-primary',
      secondary: 'text-ink',
      accent: 'text-accent-ink',
      ghost: 'text-ink',
      danger: 'text-danger',
    },
  },
  defaultVariants: { tone: 'primary' },
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tone = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
type Size = 'medium' | 'large';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  tone?: Tone;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AppButton({
  label,
  onPress,
  icon,
  tone = 'primary',
  size = 'large',
  disabled = false,
  loading = false,
}: AppButtonProps) {
  const isInactive = disabled || loading;
  // ActivityIndicator does not accept className — use raw hex matching token values
  const spinnerColor = tone === 'accent' ? '#24350b' : '#ffffff';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isInactive}
      className={buttonStyle({ tone, size, inactive: isInactive })}
      // Acceptable exception: dynamic press animation value per gluestack-ui-v5 guidelines
      style={({ pressed }) =>
        pressed && !isInactive ? { opacity: 0.82, transform: [{ scale: 0.98 }] } : {}
      }
      onPress={onPress}
    >
      {loading ? <ActivityIndicator color={spinnerColor} /> : icon}
      <Text className={labelStyle({ tone })}>{label}</Text>
    </Pressable>
  );
}
