// src/components/ui/Button.tsx
// Botón de la app. Variantes finitas; las "gradient*" llevan el degradado de la
// marca o de su acento. Con `loading` muestra un indicador sin cambiar de tamaño.
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { colors, gradients } from '../../theme/tokens';
import AppText from './AppText';
import { styles } from './Button.styles';
import PressableScale from './PressableScale';

export type ButtonVariant = 'brand' | 'success' | 'danger' | 'outline' | 'ghost' | 'soft';

interface Props {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  size?: 'md' | 'lg' | 'sm';
  accessibilityHint?: string;
}

const GRADIENT: Partial<Record<ButtonVariant, readonly [string, string]>> = {
  brand: gradients.brand,
  success: gradients.mint,
  danger: gradients.amber,
};

export default function Button({ label, onPress, variant = 'brand', icon, disabled, loading, size = 'md', accessibilityHint }: Props) {
  const grad = GRADIENT[variant];
  const filled = !!grad;
  const content = (
    <View style={[styles.inner, styles[size]]}>
      {loading ? <ActivityIndicator color={filled ? colors.white : colors.primary} /> : icon}
      <AppText variant={size === 'sm' ? 'caption' : 'title'} style={filled ? styles.labelFilled : styles[`label_${variant}`]}>
        {label}
      </AppText>
    </View>
  );
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      haptic={filled ? 'medium' : 'light'}
      style={[styles.base, !filled && styles[variant as 'outline' | 'ghost' | 'soft'], filled && styles.shadow, disabled && styles.disabled]}
    >
      {grad ? (
        <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </PressableScale>
  );
}
