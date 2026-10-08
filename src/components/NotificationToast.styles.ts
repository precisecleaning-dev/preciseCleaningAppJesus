import { StyleSheet } from 'react-native';
import { colors, radius, shadow, space } from '../theme/tokens';

export const styles = StyleSheet.create({
  host: { position: 'absolute', left: space.md, right: space.md, zIndex: 100, pointerEvents: 'box-none' },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, ...shadow.raised },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md },
  text: { flex: 1, gap: 2 },
});
