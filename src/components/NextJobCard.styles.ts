import { StyleSheet } from 'react-native';
import { accents, colors, radius, shadow, space } from '../theme/tokens';

export const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: space.lg, gap: space.md, ...shadow.raised },
  doneCard: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md },
  doneText: { flex: 1, gap: 4 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  main: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  titles: { flex: 1, gap: 2, minWidth: 0 },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  when: { color: accents.sky.ink, flex: 1 },
  running: { color: accents.violet.ink, flex: 1 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: space.md, paddingVertical: space.xs + 2, borderRadius: radius.pill },
  pulseWrap: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', width: 14, height: 14, borderRadius: 7 },
  pulseDot: { width: 10, height: 10, borderRadius: 5 },
});
