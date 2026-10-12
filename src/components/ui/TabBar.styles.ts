import { StyleSheet } from 'react-native';
import { colors, radius, shadow, space, tabBar } from '../../theme/tokens';

export const styles = StyleSheet.create({
  outer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.lg },
  bar: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.xl, padding: tabBar.padding, ...shadow.raised },
  pill: { ...StyleSheet.absoluteFill, marginHorizontal: 2, borderRadius: radius.lg },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 2, minHeight: tabBar.itemHeight },
  label: { color: colors.textMuted, fontSize: 11 },
  labelOn: { color: colors.white, fontSize: 11 },
});
