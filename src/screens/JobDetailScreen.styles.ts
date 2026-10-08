import { StyleSheet } from 'react-native';
import { colors, font, space, touchMin } from '../theme/tokens';

export const styles = StyleSheet.create({
  content: { padding: space.md, gap: space.md, paddingBottom: space.xl * 2 },
  flex: { flex: 1 },
  gap: { gap: space.sm },
  gapLg: { gap: space.md },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: touchMin },
  address: { fontSize: font.md, fontWeight: '700', color: colors.text },
  mapsLink: { fontSize: font.sm, color: colors.primary, fontWeight: '600' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.sm },
  warning: { fontSize: font.sm, color: colors.warning, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.border },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.md,
    paddingVertical: space.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  detailLabel: { fontSize: font.sm, color: colors.textMuted },
  detailValue: { flex: 1, textAlign: 'right', fontSize: font.base, color: colors.text, fontWeight: '600' },
});
