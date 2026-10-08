import { StyleSheet } from 'react-native';
import { colors, font, radius, space } from '../theme/tokens';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.xs,
  },
  cardActive: { borderColor: colors.primary, borderLeftWidth: 4 },
  pressed: { opacity: 0.9 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  client: { flex: 1, fontSize: font.md, fontWeight: '700', color: colors.text },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: space.xs },
  address: { flex: 1, fontSize: font.base, color: colors.text },
  meta: { flex: 1, fontSize: font.sm, color: colors.textMuted },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.xxs, alignItems: 'center' },
  photoCount: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 'auto' },
  photoCountText: { fontSize: font.xs, color: colors.textMuted, fontWeight: '600' },
});
