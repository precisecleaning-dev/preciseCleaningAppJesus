import { StyleSheet } from 'react-native';
import { accents, colors, radius, shadow } from '../../theme/tokens';

export const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: '#E9EEF6', borderRadius: radius.md, padding: 4 },
  indicator: { position: 'absolute', top: 4, bottom: 4, left: 4, borderRadius: radius.sm, backgroundColor: colors.surface, ...shadow.card },
  item: { flex: 1, minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  label: { color: colors.textMuted },
  labelActive: { color: colors.primary },
  count: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DCE3EE' },
  countActive: { backgroundColor: accents.brand.soft },
  countText: { color: colors.textMuted, fontSize: 11, lineHeight: 13 },
  countTextActive: { color: accents.brand.ink, fontSize: 11, lineHeight: 13 },
});
