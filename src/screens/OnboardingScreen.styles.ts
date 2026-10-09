import { StyleSheet } from 'react-native';
import { colors, radius, shadow, space } from '../theme/tokens';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.lg, minHeight: 48 },
  skip: { paddingHorizontal: space.sm, paddingVertical: space.xs },
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xl, gap: space.xxl },
  copy: { gap: space.sm, maxWidth: 360 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingBottom: space.lg },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, opacity: 0.35 },
  dotActive: { width: 26, opacity: 1 },
  next: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: space.xs, ...shadow.raised },
  nextWide: { width: 170, borderRadius: radius.xl },
});
