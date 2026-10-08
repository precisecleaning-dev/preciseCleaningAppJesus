// src/components/ui/ProgressRing.tsx
// Anillo de progreso (fotos, avance del día). El trazo se anima en el hilo de UI.
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { styles } from './ProgressRing.styles';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  size?: number;
  stroke?: number;
  progress: number; // 0..1
  color: string;
  track: string;
  children?: ReactNode;
}

export default function ProgressRing({ size = 56, stroke = 6, progress, color, track, children }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withTiming(Math.max(0, Math.min(1, progress)), { duration: 800, easing: Easing.out(Easing.cubic) }));
  }, [progress, p]);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - p.value) }));

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>{children}</View>
    </View>
  );
}
