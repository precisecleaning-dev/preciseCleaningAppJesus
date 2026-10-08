import { StyleSheet } from 'react-native';
import { colors, font, space } from '../theme/tokens';

export const styles = StyleSheet.create({
  summary: { flexDirection: 'row', gap: space.sm, marginBottom: space.xs },
  summaryCard: { flex: 1, gap: 2 },
  summaryValue: { fontSize: font.xl, fontWeight: '800' },
  pendingValue: { color: colors.warning },
  paidValue: { color: colors.success },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space.sm,
    paddingHorizontal: space.xxs,
  },
  sectionTitle: { fontSize: font.sm, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  sectionTotal: { fontSize: font.sm, fontWeight: '700', color: colors.text },
  item: { gap: space.xxs },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm },
  itemBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  house: { flex: 1, fontSize: font.base, fontWeight: '600', color: colors.text },
  amount: { fontSize: font.md, fontWeight: '800', color: colors.text },
  extra: { fontSize: font.sm, color: colors.success },
  discount: { fontSize: font.sm, color: colors.danger },
});
