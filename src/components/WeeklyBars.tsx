import { View } from 'react-native';
import { money } from '../utils/dateFormat';
import AppText from './ui/AppText';
import { BAR_HEIGHT, styles } from './WeeklyBars.styles';

export interface WeekBar {
  key: string;
  label: string;
  paid: number;
  pending: number;
}

export default function WeeklyBars({ bars }: { bars: WeekBar[] }) {
  const max = Math.max(0, ...bars.map((b) => b.paid + b.pending));
  const heightOf = (v: number) => (max > 0 ? (v / max) * BAR_HEIGHT : 0);
  return (
    <View style={styles.row}>
      {bars.map((bar) => {
        const total = bar.paid + bar.pending;
        const pendH = heightOf(bar.pending);
        const paidH = heightOf(bar.paid);
        return (
          <View key={bar.key} style={styles.col} accessible accessibilityLabel={`${bar.label}: ${money(total)}`}>
            <AppText variant="caption" tone="muted" numberOfLines={1} style={styles.value}>
              {total > 0 ? `$${Math.round(total)}` : ''}
            </AppText>
            <View style={styles.slot}>
              <View style={styles.stack}>
                {pendH > 0 && <View style={[styles.seg, styles.pending, styles.top, { height: pendH }]} />}
                {paidH > 0 && <View style={[styles.seg, styles.paid, pendH === 0 && styles.top, { height: paidH }]} />}
                {total === 0 && <View style={styles.zero} />}
              </View>
            </View>
            <AppText variant="caption" tone="soft" numberOfLines={1}>
              {bar.label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}
