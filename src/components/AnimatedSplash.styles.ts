import { StyleSheet } from 'react-native';
import { colors, radius, shadow, space } from '../theme/tokens';

export const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFill, zIndex: 999, backgroundColor: colors.primary },
  passThrough: { pointerEvents: 'none' },
  fill: { flex: 1 },
  fillAbs: { ...StyleSheet.absoluteFill },
  nativeMark: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  nativeMarkImg: { width: 120, height: 120 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm },
  // La sombra va en un contenedor aparte: con overflow:hidden iOS no la dibuja.
  logoShadow: { borderRadius: radius.xl + 6, backgroundColor: colors.white, marginBottom: space.lg, ...shadow.raised },
  logoBox: { width: 120, height: 120, borderRadius: radius.xl + 6, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logo: { width: 86, height: 86 },
  shine: { position: 'absolute', top: -40, bottom: -40, left: -120, width: 70 },
  sparkle: { position: 'absolute' },
  spA: { top: -14, right: -22 },
  spB: { bottom: 20, left: -30 },
  spC: { top: 30, right: -40 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingBottom: 70 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.85)' },
  orb: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' },
  orbA: { width: 340, height: 340, top: -120, right: -140 },
  orbB: { width: 260, height: 260, bottom: -80, left: -110 },
});
