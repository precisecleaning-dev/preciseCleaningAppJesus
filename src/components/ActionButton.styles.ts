import { StyleSheet } from 'react-native';
import { colors, font, radius, space, touchMin } from '../theme/tokens';

export const styles = StyleSheet.create({
  base: {
    minHeight: touchMin,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  compact: { minHeight: 40, paddingHorizontal: space.md },
  primary: { backgroundColor: colors.primary },
  success: { backgroundColor: colors.success },
  danger: { backgroundColor: colors.danger },
  outline: { backgroundColor: colors.surface, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  label: { fontSize: font.base, fontWeight: '700' },
  labelFilled: { color: colors.white },
  labelOutline: { color: colors.primary },
});
