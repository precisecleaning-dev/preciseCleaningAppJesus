import { StyleSheet } from 'react-native';
import { colors, radius, shadow, space } from '../../theme/tokens';

export const styles = StyleSheet.create({
  block: { backgroundColor: '#E8EEF7', borderRadius: radius.sm, overflow: 'hidden' },
  round: { borderRadius: radius.pill },
  shine: { ...StyleSheet.absoluteFill, width: '100%' },
  fill: { flex: 1 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.md, gap: space.sm, ...shadow.card },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  col: { flex: 1, gap: space.xs },
});
