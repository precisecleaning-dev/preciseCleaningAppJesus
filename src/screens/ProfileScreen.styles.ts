import { StyleSheet } from 'react-native';
import { colors, font, radius, space } from '../theme/tokens';

export const styles = StyleSheet.create({
  content: { padding: space.md, gap: space.md },
  center: { alignItems: 'center', gap: 2 },
  gap: { gap: space.sm },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xs,
  },
  avatarText: { fontSize: font.xl, fontWeight: '800', color: colors.primary },
  name: { fontSize: font.lg, fontWeight: '700', color: colors.text },
  queueText: { marginLeft: space.xs, fontSize: font.base, color: colors.text, flex: 1 },
  error: { fontSize: font.xs, color: colors.danger },
  version: { textAlign: 'center', fontSize: font.xs, color: colors.textSoft },
});
