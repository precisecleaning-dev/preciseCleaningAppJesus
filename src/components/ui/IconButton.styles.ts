import { StyleSheet } from 'react-native';
import { accents, colors, radius, shadow, touchMin } from '../../theme/tokens';

export const styles = StyleSheet.create({
  btn: { width: touchMin, height: touchMin, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  glass: { backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder },
  light: { backgroundColor: colors.surface, ...shadow.card },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: accents.coral.solid,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: { fontSize: 10, lineHeight: 12 },
});
