// src/components/ui/PressableScale.tsx
// ⭐ Todo lo que se toca "responde": se encoge con un resorte en el hilo de UI
//    (Reanimated, sin pasar por JS) y da un toque háptico ligero.
import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { motion } from '../../theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props extends Omit<PressableProps, 'style' | 'children'> {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Cuánto se encoge al presionar (0.96 por defecto). */
  scaleTo?: number;
  haptic?: 'light' | 'medium' | 'none';
}

export default function PressableScale({ children, style, scaleTo = 0.96, haptic = 'light', onPressIn, onPressOut, onPress, disabled, ...rest }: Props) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        scale.set(withSpring(scaleTo, motion.spring));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.set(withSpring(1, motion.spring));
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic !== 'none') {
          Haptics.impactAsync(haptic === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
        }
        onPress?.(e);
      }}
      style={[style, animated]}
    >
      {children}
    </AnimatedPressable>
  );
}
