import { StyleSheet } from 'react-native';
import { colors, font, radius, space } from '../theme/tokens';

export const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xxs,
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    maxWidth: '100%',
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { fontSize: font.xs, fontWeight: '700' },
  textOnColor: { color: colors.text },
  neutral: { backgroundColor: colors.bg, borderColor: colors.border },
  neutralText: { color: colors.textMuted },
  progress: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  progressText: { color: colors.primaryDark },
  done: { backgroundColor: colors.successSoft, borderColor: colors.success },
  doneText: { color: colors.success },
  warning: { backgroundColor: colors.warningSoft, borderColor: colors.warning },
  warningText: { color: colors.warning },
});
