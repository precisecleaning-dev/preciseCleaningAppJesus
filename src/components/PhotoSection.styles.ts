import { StyleSheet } from 'react-native';
import { colors, font, radius, space } from '../theme/tokens';

const THUMB = 96;

export const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: font.base, fontWeight: '700', color: colors.text },
  pendingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
  },
  pendingText: { fontSize: font.xs, fontWeight: '700', color: colors.warning },
  empty: { fontSize: font.sm, color: colors.textSoft, paddingVertical: space.sm },
  strip: { gap: space.xs },
  thumb: { width: THUMB, height: THUMB, borderRadius: radius.sm, backgroundColor: colors.border },
  thumbOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  thumbProgress: { color: colors.white, fontSize: font.xs, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: space.sm },
  actionItem: { flex: 1 },
});
