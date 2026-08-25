import type { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

import { colors } from '@/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = Omit<ComponentProps<typeof Pressable>, 'children'> & {
  children: ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
};

const buttonClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary active:bg-primary-pressed',
  secondary: 'border border-border bg-surface active:bg-canvas',
  ghost: 'bg-transparent active:bg-canvas',
  danger: 'bg-danger active:opacity-80',
};

const labelClasses: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-ink',
  ghost: 'text-primary',
  danger: 'text-white',
};

export function Button({
  children,
  variant = 'primary',
  loading = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      className={`min-h-[50px] flex-row items-center justify-center gap-2 rounded-md px-4 ${buttonClasses[variant]} ${isDisabled ? 'opacity-50' : ''} ${className ?? ''}`}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'secondary' || variant === 'ghost' ? colors.primary : colors.surface}
        />
      ) : null}
      <Text className={`text-[15px] font-black ${labelClasses[variant]}`}>{children}</Text>
    </Pressable>
  );
}
