// src/components/ui/FloatingIllustration.tsx
// ⭐ Ilustración viva hecha con la paleta de la app (sin imágenes externas):
//    un círculo con degradado, el ícono principal al centro y burbujas de color
//    que flotan alrededor. Se usa en bienvenida y en estados vacíos.
import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { accents, colors, type AccentName } from '../../theme/tokens';
import { styles } from './FloatingIllustration.styles';

interface Orbit {
  icon: LucideIcon;
  accent: AccentName;
}

interface Props {
  icon: LucideIcon;
  gradient: readonly [string, string];
  orbits: [Orbit, Orbit, Orbit];
  size?: number;
}

function Floater({ children, delay, distance, style }: { children: React.ReactNode; delay: number; distance: number; style: object }) {
  const reduce = useReducedMotion();
  const y = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    y.set(withDelay(
      delay,
      withRepeat(withSequence(withTiming(-distance, { duration: 1600, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) })), -1),
    ));
  }, [delay, distance, reduce, y]);
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

export default function FloatingIllustration({ icon: Icon, gradient, orbits, size = 220 }: Props) {
  const core = size * 0.52;
  const POS = [styles.posA, styles.posB, styles.posC];
  return (
    <View style={[styles.stage, { width: size, height: size }]}>
      <View style={[styles.halo, { width: size, height: size, borderRadius: size / 2 }]} />
      <Floater delay={0} distance={8} style={styles.coreWrap}>
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.core, { width: core, height: core, borderRadius: core / 2 }]}>
          <Icon size={core * 0.42} color={colors.white} strokeWidth={1.8} />
        </LinearGradient>
      </Floater>
      {orbits.map((o, i) => {
        const OIcon = o.icon;
        return (
          <Floater key={i} delay={300 * (i + 1)} distance={12} style={[styles.orbit, POS[i], { backgroundColor: accents[o.accent].solid }]}>
            <OIcon size={20} color={colors.white} strokeWidth={2.2} />
          </Floater>
        );
      })}
    </View>
  );
}
