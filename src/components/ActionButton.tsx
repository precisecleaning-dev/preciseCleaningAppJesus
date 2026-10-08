// src/components/ActionButton.tsx
// Botón base con variantes finitas (equivalente a .btn-primary / .btn-outline).
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { colors } from '../theme/tokens';
import { styles } from './ActionButton.styles';

type Variant = 'primary' | 'success' | 'outline' | 'danger' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
}

export default function ActionButton({ label, onPress, variant = 'primary', icon, disabled, loading, compact }: Props) {
  const isFilled = variant === 'primary' || variant === 'success' || variant === 'danger';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled || !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        compact && styles.compact,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? <ActivityIndicator color={isFilled ? colors.white : colors.primary} /> : icon}
      <Text style={[styles.label, isFilled ? styles.labelFilled : styles.labelOutline, variant === 'danger' && styles.labelFilled]}>
        {label}
      </Text>
    </Pressable>
  );
}
