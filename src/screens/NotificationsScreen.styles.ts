import { StyleSheet } from 'react-native';
import { accents, colors, radius, shadow, space } from '../theme/tokens';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: space.md, gap: space.sm, paddingBottom: space.xxl },
  section: { marginTop: space.sm, marginBottom: space.xxs, marginLeft: space.xxs },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm, backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.md, ...shadow.card },
  unread: { backgroundColor: '#F2F7FF', borderWidth: 1, borderColor: accents.brand.soft },
  text: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  title: { flex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: accents.coral.solid, marginTop: 4 },
});
