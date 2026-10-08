// src/components/AnimatedSplash.tsx
// ⭐ ANIMACIÓN DE APERTURA.
//    1. La pantalla nativa (mismo azul y mismo logo) se quita apenas esta vista
//       está montada, así no hay salto.
//    2. El logo entra con resorte y un leve giro, un brillo lo barre en diagonal
//       y aparecen chispas alrededor: la idea de "recién limpio".
//    3. El nombre y el lema suben en cascada; abajo, tres puntos indican que
//       se está preparando la sesión.
//    4. Cuando todo está listo (fuentes + sesión) y pasó el tiempo mínimo, la
//       capa se agranda un poco y se desvanece, mostrando la app debajo.
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { Sparkles } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { colors, gradients } from '../theme/tokens';
import { styles } from './AnimatedSplash.styles';
import AppText from './ui/AppText';

const MIN_MS = 1900;

function Sparkle({ delay, style }: { delay: number; style: object }) {
  const s = useSharedValue(0);
  useEffect(() => {
    s.set(withDelay(delay, withSequence(withSpring(1.15, { damping: 7 }), withSpring(0.85), withRepeat(withSequence(withTiming(1.05, { duration: 700 }), withTiming(0.85, { duration: 700 })), -1, true))));
  }, [delay, s]);
  const a = useAnimatedStyle(() => ({ opacity: Math.min(1, s.value), transform: [{ scale: s.value }] }));
  return (
    <Animated.View style={[styles.sparkle, style, a]}>
      <Sparkles size={22} color={colors.white} strokeWidth={2} />
    </Animated.View>
  );
}

function Dot({ i }: { i: number }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.set(withDelay(i * 140, withRepeat(withSequence(withTiming(-7, { duration: 320 }), withTiming(0, { duration: 320 })), -1)));
  }, [i, y]);
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[styles.dot, a]} />;
}

interface Props {
  /** La app ya puede mostrarse (fuentes cargadas y sesión resuelta). */
  ready: boolean;
  /** Las fuentes ya cargaron: el texto se pinta recién entonces (si no, saldría en la del sistema). */
  fontsReady: boolean;
  label: { name: string; tagline: string };
  onDone: () => void;
}

export default function AnimatedSplash({ ready, fontsReady, label, onDone }: Props) {
  const reduce = useReducedMotion();
  const [minPassed, setMinPassed] = useState(false);
  const logo = useSharedValue(0);
  const shine = useSharedValue(-1);
  const exit = useSharedValue(0);
  const bg = useSharedValue(0);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
    bg.set(withTiming(1, { duration: 600 }));
    logo.set(withDelay(120, withSpring(1, { damping: 11, stiffness: 120 })));
    shine.set(withDelay(550, withTiming(1, { duration: 900, easing: Easing.inOut(Easing.cubic) })));
    const timer = setTimeout(() => setMinPassed(true), reduce ? 500 : MIN_MS);
    return () => clearTimeout(timer);
  }, [logo, shine, reduce, bg]);

  useEffect(() => {
    if (ready && minPassed) {
      exit.set(withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }, (finished) => {
        if (finished) scheduleOnRN(onDone);
      }));
    }
  }, [ready, minPassed, exit, onDone]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, logo.value * 1.4),
    transform: [{ scale: 0.4 + 0.6 * logo.value }, { rotate: `${(1 - logo.value) * -14}deg` }],
  }));
  const shineStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shine.value * 160 }, { rotate: '20deg' }] }));
  const layerStyle = useAnimatedStyle(() => ({ opacity: 1 - exit.value, transform: [{ scale: 1 + exit.value * 0.08 }] }));
  // Continuidad con la pantalla nativa (azul liso + logo blanco al centro):
  // el degradado aparece encima y el logo blanco se desvanece mientras entra la caja.
  const gradientStyle = useAnimatedStyle(() => ({ opacity: bg.value }));
  const nativeMarkStyle = useAnimatedStyle(() => ({ opacity: 1 - Math.min(1, logo.value * 1.6) }));

  return (
    <Animated.View style={[styles.layer, ready && minPassed && styles.passThrough, layerStyle]}>
      <Animated.View style={[styles.fillAbs, gradientStyle]}>
        <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fill} />
      </Animated.View>
      <Animated.View style={[styles.nativeMark, nativeMarkStyle]}>
        <Image source={require('../../assets/logo-mark-white.png')} style={styles.nativeMarkImg} contentFit="contain" />
      </Animated.View>
      <View style={styles.fill}>
        <View style={[styles.orb, styles.orbA]} />
        <View style={[styles.orb, styles.orbB]} />
        <View style={styles.center}>
          <View>
            <Animated.View style={[styles.logoShadow, logoStyle]}>
              <View style={styles.logoBox}>
                <Image source={require('../../assets/logo-mark.png')} style={styles.logo} contentFit="contain" />
                <Animated.View style={[styles.shine, shineStyle]}>
                  <LinearGradient colors={gradients.shimmer} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.fill} />
                </Animated.View>
              </View>
            </Animated.View>
            {!reduce && (
              <>
                <Sparkle delay={700} style={styles.spA} />
                <Sparkle delay={850} style={styles.spB} />
                <Sparkle delay={1000} style={styles.spC} />
              </>
            )}
          </View>
          {fontsReady && (
            <>
              <Animated.View entering={FadeInDown.delay(350).springify().damping(16)}>
                <AppText variant="display" tone="inverse" center>
                  {label.name}
                </AppText>
              </Animated.View>
              <Animated.View entering={FadeInDown.delay(520).springify().damping(16)}>
                <AppText variant="label" tone="inverseMuted" center>
                  {label.tagline}
                </AppText>
              </Animated.View>
            </>
          )}
        </View>
        <View style={styles.dots}>
          <Dot i={0} />
          <Dot i={1} />
          <Dot i={2} />
        </View>
      </View>
    </Animated.View>
  );
}
