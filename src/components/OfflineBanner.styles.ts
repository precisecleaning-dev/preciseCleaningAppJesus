import { StyleSheet } from 'react-native';
import { colors, font, space } from '../theme/tokens';

export const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    backgroundColor: colors.warningSoft,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  text: { flex: 1, fontSize: font.sm, color: colors.warning, fontWeight: '600' },
});
