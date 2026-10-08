// src/components/Celebration.tsx
// Ráfaga de confeti con los colores de la app al terminar una casa.
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { accents } from '../theme/tokens';
import { styles } from './Celebration.styles';

const COLORS = [accents.mint.solid, accents.sky.solid, accents.violet.solid, accents.amber.solid, accents.coral.solid, accents.teal.solid];
const PIECES = Array.from({ length: 18 }, (_, i) => {
  const angle = (i / 18) * Math.PI * 2;
  const dist = 90 + (i % 3) * 38;
  return { dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist - 40, color: COLORS[i % COLORS.length], round: i % 2 === 0, rot: (i % 5) * 70 };
});

function Piece({ dx, dy, color, round, rot }: (typeof PIECES)[number]) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) }));
  }, [p]);
  const a = useAnimatedStyle(() => ({
    opacity: p.value < 0.7 ? 1 : 1 - (p.value - 0.7) / 0.3,
    transform: [{ translateX: dx * p.value }, { translateY: dy * p.value + 60 * p.value * p.value }, { rotate: `${rot * p.value}deg` }, { scale: 1 - 0.3 * p.value }],
  }));
  return <Animated.View style={[styles.piece, round ? styles.round : styles.rect, { backgroundColor: color }, a]} />;
}

export default function Celebration() {
  const reduce = useReducedMotion();
  const flash = useSharedValue(0);
  useEffect(() => {
    flash.set(withDelay(0, withTiming(1, { duration: 700 })));
  }, [flash]);
  const ring = useAnimatedStyle(() => ({ opacity: 0.5 * (1 - flash.value), transform: [{ scale: 0.4 + flash.value * 2.2 }] }));
  if (reduce) return null;
  return (
    <View style={styles.layer}>
      <Animated.View style={[styles.ring, ring]} />
      {PIECES.map((pc, i) => (
        <Piece key={i} {...pc} />
      ))}
    </View>
  );
}
