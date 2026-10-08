// src/components/ui/AnimatedNumber.tsx
// ⭐ Montos que "cuentan" hasta su valor. Corre en el hilo de UI: se anima un
//    TextInput no editable con animatedProps (patrón recomendado de Reanimated
//    para texto que cambia cada frame sin re-renderizar React).
import { useEffect } from 'react';
import { TextInput, type StyleProp, type TextStyle } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';

const AnimatedInput = Animated.createAnimatedComponent(TextInput);

interface Props {
  value: number;
  style?: StyleProp<TextStyle>;
  prefix?: string;
  decimals?: number;
  duration?: number;
}

export default function AnimatedNumber({ value, style, prefix = '$', decimals = 2, duration = 900 }: Props) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.set(withTiming(value, { duration, easing: Easing.out(Easing.cubic) }));
  }, [value, duration, v]);

  const animatedProps = useAnimatedProps(() => {
    const fixed = v.value.toFixed(decimals);
    const [int, dec] = fixed.split('.');
    const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const text = `${prefix}${withCommas}${dec ? `.${dec}` : ''}`;
    // `text` no está en los tipos de TextInputProps, pero es la prop nativa que se actualiza.
    return { text, defaultValue: text } as unknown as Record<string, string>;
  });

  return <AnimatedInput editable={false} underlineColorAndroid="transparent" style={style} animatedProps={animatedProps} accessibilityLabel={`${prefix}${value.toFixed(decimals)}`} />;
}
