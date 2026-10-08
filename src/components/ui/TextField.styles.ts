import { StyleSheet } from 'react-native';
import { colors, fonts, radius, space, touchMin } from '../../theme/tokens';

export const styles = StyleSheet.create({
  wrap: {
    minHeight: touchMin + 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#F8FAFD',
  },
  focused: { borderColor: colors.primary, backgroundColor: colors.surface },
  invalid: { borderColor: colors.danger },
  input: { flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.text, paddingVertical: space.sm },
});
