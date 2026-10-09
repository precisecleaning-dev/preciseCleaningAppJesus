import { StyleSheet } from 'react-native';
import { accents, colors, radius, shadow } from '../../theme/tokens';

export const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: colors.track, borderRadius: radius.md, padding: 4 },
  item: { flex: 1, minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: radius.sm },
  itemActive: { backgroundColor: colors.surface, ...shadow.card },
  label: { color: colors.textMuted },
  labelActive: { color: colors.primary },
  count: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.trackStrong },
  countActive: { backgroundColor: accents.brand.soft },
  countText: { color: colors.textMuted, fontSize: 11, lineHeight: 13 },
  countTextActive: { color: accents.brand.ink },
});
