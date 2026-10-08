// src/components/WeeklyBars.tsx
// Barras de las últimas semanas: verde = pagado, ámbar = pendiente. Crecen al
// aparecer. La escala es la misma para todas las barras (máximo = semana más alta).
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { accents } from '../theme/tokens';
import { money } from '../utils/dateFormat';
import { styles } from './WeeklyBars.styles';
import AppText from './ui/AppText';

export interface WeekBar {
  key: string;
  label: string;
  paid: number;
  pending: number;
}

const H = 110;

function Bar({ bar, max, i }: { bar: WeekBar; max: number; i: number }) {
  const g = useSharedValue(0);
  useEffect(() => {
    g.set(withDelay(i * 70, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) })));
  }, [g, i]);
  const total = bar.paid + bar.pending;
  const paidH = max > 0 ? (bar.paid / max) * H : 0;
  const pendH = max > 0 ? (bar.pending / max) * H : 0;
  const grow = useAnimatedStyle(() => ({ transform: [{ scaleY: g.value }] }));
  return (
    <View style={styles.col} accessible accessibilityLabel={`${bar.label}: ${money(total)}`}>
      <AppText variant="caption" tone="muted" numberOfLines={1} style={styles.value}>
        {total > 0 ? `$${Math.round(total)}` : ''}
      </AppText>
      <View style={styles.slot}>
        <Animated.View style={[styles.stack, grow]}>
          {pendH > 0 && <View style={[styles.seg, styles.top, { height: pendH, backgroundColor: accents.amber.solid }]} />}
          {paidH > 0 && <View style={[styles.seg, pendH > 0 ? null : styles.top, { height: paidH, backgroundColor: accents.mint.solid }]} />}
          {total === 0 && <View style={styles.zero} />}
        </Animated.View>
      </View>
      <AppText variant="caption" tone="soft" numberOfLines={1}>
        {bar.label}
      </AppText>
    </View>
  );
}

export default function WeeklyBars({ bars }: { bars: WeekBar[] }) {
  const max = Math.max(0, ...bars.map((b) => b.paid + b.pending));
  return (
    <View style={styles.row}>
      {bars.map((b, i) => (
        <Bar key={b.key} bar={b} max={max} i={i} />
      ))}
    </View>
  );
}
