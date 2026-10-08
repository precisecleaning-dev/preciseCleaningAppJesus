import { StyleSheet } from 'react-native';
import { colors, font, radius, space, touchMin } from '../theme/tokens';

export const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  title: { fontSize: font.base, fontWeight: '700', color: colors.text },
  bubble: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: space.sm,
    alignSelf: 'flex-start',
    maxWidth: '92%',
  },
  bubbleMine: { backgroundColor: colors.primarySoft, alignSelf: 'flex-end' },
  bubblePending: { opacity: 0.6, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary },
  text: { fontSize: font.base, color: colors.text },
  meta: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: space.xs, marginTop: space.xs },
  input: { flex: 1, maxHeight: 120, paddingTop: space.sm },
  sendBtn: {
    width: touchMin,
    height: touchMin,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.5 },
  sendPressed: { opacity: 0.85 },
});
