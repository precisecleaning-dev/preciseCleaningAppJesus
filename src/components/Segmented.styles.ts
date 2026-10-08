import { StyleSheet } from 'react-native';
import { colors, font, radius, space } from '../theme/tokens';

export const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    borderRadius: radius.md,
    padding: 3,
    marginHorizontal: space.md,
    marginTop: space.sm,
  },
  item: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  itemActive: { backgroundColor: colors.surface },
  label: { fontSize: font.sm, fontWeight: '600', color: colors.textMuted },
  labelActive: { color: colors.primary },
});
