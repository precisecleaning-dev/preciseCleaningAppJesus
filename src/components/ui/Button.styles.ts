import { StyleSheet } from 'react-native';
import { accents, colors, radius, shadow, space, touchMin } from '../../theme/tokens';

export const styles = StyleSheet.create({
  base: { borderRadius: radius.md, overflow: 'hidden' },
  shadow: { ...shadow.card, overflow: 'visible', backgroundColor: colors.primary },
  gradient: { borderRadius: radius.md },
  inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs, paddingHorizontal: space.lg },
  md: { minHeight: touchMin + 4 },
  lg: { minHeight: 58 },
  sm: { minHeight: 38, paddingHorizontal: space.md },
  outline: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent' },
  soft: { backgroundColor: accents.brand.soft },
  disabled: { opacity: 0.45 },
  labelFilled: { color: colors.white },
  label_outline: { color: colors.primary },
  label_ghost: { color: colors.primary },
  label_soft: { color: accents.brand.ink },
  label_brand: { color: colors.white },
  label_success: { color: colors.white },
  label_danger: { color: colors.white },
});
