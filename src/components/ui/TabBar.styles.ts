import { StyleSheet } from 'react-native';
import { accents, colors, radius, shadow, space } from '../../theme/tokens';

export const styles = StyleSheet.create({
  outer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.lg, backgroundColor: 'transparent' },
  bar: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.xl, padding: 6, ...shadow.raised },
  pill: { position: 'absolute', top: 6, bottom: 6, left: 6, borderRadius: radius.lg, overflow: 'hidden' },
  pillFill: { flex: 1 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 2, minHeight: 56 },
  label: { color: colors.textMuted, fontSize: 11 },
  labelOn: { color: colors.white, fontSize: 11 },
  dot: { position: 'absolute', top: -2, right: -4, width: 9, height: 9, borderRadius: 5, backgroundColor: accents.coral.solid, borderWidth: 1.5, borderColor: colors.white },
});
