import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { colors, gradients } from '../../theme/tokens';
import AppText from './AppText';
import { styles } from './Button.styles';
import Touchable from './Touchable';

type FlatVariant = 'outline' | 'ghost' | 'soft';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'brand' | 'success' | FlatVariant;
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  size?: 'md' | 'lg' | 'sm';
}

export default function Button({ label, onPress, variant = 'brand', icon, disabled, loading, size = 'md' }: Props) {
  const filled = variant === 'brand' || variant === 'success';
  const content = (
    <View style={[styles.inner, styles[size]]}>
      {loading ? <ActivityIndicator color={filled ? colors.white : colors.primary} /> : icon}
      <AppText variant={size === 'sm' ? 'caption' : 'title'} style={filled ? styles.labelFilled : styles[`label_${variant}`]}>
        {label}
      </AppText>
    </View>
  );
  return (
    <Touchable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      haptic={filled ? 'medium' : 'light'}
      style={[styles.base, filled ? styles.shadow : styles[variant], disabled && styles.disabled]}
    >
      {filled ? (
        <LinearGradient colors={variant === 'success' ? gradients.mint : gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </Touchable>
  );
}
