// src/screens/OnboardingScreen.tsx
// ⭐ Bienvenida (solo la primera vez en el teléfono): tres pantallas que se
//    deslizan con efecto parallax, puntos que se estiran según el avance y un
//    botón redondo con degradado para avanzar.
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Banknote, Bell, CalendarCheck, Camera, CloudUpload, House, Images, MapPin, Sparkles, Wallet, type LucideIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, { interpolate, useAnimatedRef, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, Extrapolation, type SharedValue } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppText from '../components/ui/AppText';
import FloatingIllustration from '../components/ui/FloatingIllustration';
import PressableScale from '../components/ui/PressableScale';
import { useLanguage } from '../context/LanguageContext';
import { colors, gradients, type AccentName } from '../theme/tokens';
import { styles } from './OnboardingScreen.styles';

interface Slide {
  icon: LucideIcon;
  gradient: readonly [string, string];
  orbits: [{ icon: LucideIcon; accent: AccentName }, { icon: LucideIcon; accent: AccentName }, { icon: LucideIcon; accent: AccentName }];
  title: 'ob1Title' | 'ob2Title' | 'ob3Title';
  body: 'ob1Body' | 'ob2Body' | 'ob3Body';
}

const SLIDES: Slide[] = [
  { icon: House, gradient: gradients.brand, orbits: [{ icon: MapPin, accent: 'coral' }, { icon: Bell, accent: 'amber' }, { icon: CalendarCheck, accent: 'mint' }], title: 'ob1Title', body: 'ob1Body' },
  { icon: Camera, gradient: gradients.violet, orbits: [{ icon: Images, accent: 'sky' }, { icon: Sparkles, accent: 'amber' }, { icon: CloudUpload, accent: 'teal' }], title: 'ob2Title', body: 'ob2Body' },
  { icon: Wallet, gradient: gradients.mint, orbits: [{ icon: Banknote, accent: 'amber' }, { icon: CalendarCheck, accent: 'violet' }, { icon: Sparkles, accent: 'coral' }], title: 'ob3Title', body: 'ob3Body' },
];

function Page({ slide, index, x, width }: { slide: Slide; index: number; x: SharedValue<number>; width: number }) {
  const { t } = useLanguage();
  const art = useAnimatedStyle(() => {
    const p = x.value / width - index;
    return {
      opacity: interpolate(p, [-0.6, 0, 0.6], [0, 1, 0], Extrapolation.CLAMP),
      transform: [{ translateX: interpolate(p, [-1, 0, 1], [-width * 0.35, 0, width * 0.35]) }, { scale: interpolate(p, [-1, 0, 1], [0.7, 1, 0.7], Extrapolation.CLAMP) }],
    };
  });
  const text = useAnimatedStyle(() => {
    const p = x.value / width - index;
    return { opacity: interpolate(p, [-0.5, 0, 0.5], [0, 1, 0], Extrapolation.CLAMP), transform: [{ translateY: interpolate(Math.abs(p), [0, 1], [0, 30]) }] };
  });
  return (
    <View style={[styles.page, { width }]}>
      <Animated.View style={art}>
        <FloatingIllustration icon={slide.icon} gradient={slide.gradient} orbits={slide.orbits} size={Math.min(280, width * 0.72)} />
      </Animated.View>
      <Animated.View style={[styles.copy, text]}>
        <AppText variant="display" center>
          {t[slide.title]}
        </AppText>
        <AppText variant="body" tone="muted" center>
          {t[slide.body]}
        </AppText>
      </Animated.View>
    </View>
  );
}

function Dot({ i, x, width }: { i: number; x: SharedValue<number>; width: number }) {
  const a = useAnimatedStyle(() => {
    const d = Math.abs(x.value / width - i);
    return { width: interpolate(d, [0, 1], [26, 8], Extrapolation.CLAMP), opacity: interpolate(d, [0, 1], [1, 0.35], Extrapolation.CLAMP) };
  });
  return <Animated.View style={[styles.dot, a]} />;
}

export default function OnboardingScreen({ onFinish }: { onFinish: () => void }) {
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const x = useSharedValue(0);
  const [page, setPage] = useState(0);
  const ref = useAnimatedRef<Animated.ScrollView>();
  const pageRef = useRef(0);

  const onScroll = useAnimatedScrollHandler((e) => {
    x.set(e.contentOffset.x);
  });

  const goNext = () => {
    if (pageRef.current >= SLIDES.length - 1) return onFinish();
    const next = pageRef.current + 1;
    ref.current?.scrollTo({ x: next * width, animated: true });
    pageRef.current = next;
    setPage(next);
  };

  const isLast = page === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.top}>
        <AppText variant="label" tone="brand">
          {t.appName}
        </AppText>
        {!isLast && (
          <PressableScale onPress={onFinish} accessibilityLabel={t.skip} style={styles.skip}>
            <AppText variant="bodyStrong" tone="muted">
              {t.skip}
            </AppText>
          </PressableScale>
        )}
      </View>
      <Animated.ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const p = Math.round(e.nativeEvent.contentOffset.x / width);
          pageRef.current = p;
          setPage(p);
        }}
      >
        {SLIDES.map((s, i) => (
          <Page key={s.title} slide={s} index={i} x={x} width={width} />
        ))}
      </Animated.ScrollView>
      <View style={styles.bottom}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <Dot key={s.title} i={i} x={x} width={width} />
          ))}
        </View>
        <PressableScale onPress={goNext} accessibilityLabel={isLast ? t.start : t.next} haptic="medium" scaleTo={0.9}>
          <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.next, isLast && styles.nextWide]}>
            {isLast && (
              <AppText variant="title" tone="inverse">
                {t.start}
              </AppText>
            )}
            <ArrowRight size={24} color={colors.white} strokeWidth={2.4} />
          </LinearGradient>
        </PressableScale>
      </View>
    </SafeAreaView>
  );
}
