import { StyleSheet } from 'react-native';
import { colors, radius, shadow, space, touchMin } from '../theme/tokens';

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, paddingBottom: space.xxl },
  hero: { alignItems: 'center', gap: space.md, paddingBottom: 90, borderBottomLeftRadius: 48, borderBottomRightRadius: 48, overflow: 'hidden' },
  orb: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.09)' },
  orbA: { width: 260, height: 260, top: -100, right: -90 },
  orbB: { width: 180, height: 180, bottom: -60, left: -60 },
  logoBox: { width: 92, height: 92, borderRadius: radius.xl, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', ...shadow.raised },
  logo: { width: 66, height: 66 },
  card: { marginTop: -62, marginHorizontal: space.lg, backgroundColor: colors.surface, borderRadius: radius.xl, padding: space.lg, gap: space.md, ...shadow.raised },
  cardHead: { gap: space.xxs, marginBottom: space.xs },
  link: { minHeight: touchMin, alignItems: 'center', justifyContent: 'center' },
});
