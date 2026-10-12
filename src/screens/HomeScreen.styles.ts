import { StyleSheet } from 'react-native';
import { colors, radius, space, TAB_BAR_SPACE, type } from '../theme/tokens';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { paddingBottom: TAB_BAR_SPACE },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.glass,
    borderWidth: 2,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hello: { flex: 1, minWidth: 0 },
  stats: { flexDirection: 'row', gap: space.sm },
  stat: { flex: 1, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder, borderRadius: radius.lg, padding: space.sm, gap: 2 },
  statIcon: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  statValue: { ...type.number, fontSize: 24, lineHeight: 30, color: colors.white, padding: 0 },
  overlap: { marginTop: -62, paddingHorizontal: space.md },
  tabs: { paddingHorizontal: space.md, paddingTop: space.lg, paddingBottom: space.sm },
  item: { paddingHorizontal: space.md, paddingBottom: space.sm },
  skeletons: { paddingHorizontal: space.md, gap: space.sm },
});
