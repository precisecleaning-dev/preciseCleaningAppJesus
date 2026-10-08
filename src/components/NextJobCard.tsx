// src/components/NextJobCard.tsx
// ⭐ "Tu próxima casa": la tarjeta destacada del inicio. Si la casa ya está en
//    curso muestra desde cuándo y un pulso violeta; si no, el horario. Si no
//    queda nada para hoy, celebra el día completo.
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, CalendarCheck, PartyPopper, Sparkles, Star } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useJobs } from '../context/JobsContext';
import { useLanguage } from '../context/LanguageContext';
import { fmt } from '../i18n/strings';
import { accents, colors, gradients } from '../theme/tokens';
import type { Property } from '../types';
import { fmtTime } from '../utils/dateFormat';
import { workStateOf } from '../utils/jobState';
import { jobVisual } from '../utils/jobVisual';
import { styles } from './NextJobCard.styles';
import AppText from './ui/AppText';
import FloatingIllustration from './ui/FloatingIllustration';
import IconBubble from './ui/IconBubble';
import PressableScale from './ui/PressableScale';

function Pulse({ color }: { color: string }) {
  const reduce = useReducedMotion();
  const s = useSharedValue(0);
  useEffect(() => {
    if (!reduce) s.set(withRepeat(withTiming(1, { duration: 1400 }), -1, false));
  }, [reduce, s]);
  const ring = useAnimatedStyle(() => ({ opacity: 1 - s.value, transform: [{ scale: 1 + s.value * 1.6 }] }));
  return (
    <View style={styles.pulseWrap}>
      <Animated.View style={[styles.pulseRing, { backgroundColor: color }, ring]} />
      <View style={[styles.pulseDot, { backgroundColor: color }]} />
    </View>
  );
}

export default function NextJobCard({ job, onOpen }: { job: Property | null; onOpen: (j: Property) => void }) {
  const { t } = useLanguage();
  const { clientName } = useJobs();

  if (!job) {
    return (
      <Animated.View entering={FadeInDown.springify().damping(16)} style={[styles.card, styles.doneCard]}>
        <FloatingIllustration icon={PartyPopper} gradient={gradients.mint} orbits={[{ icon: Star, accent: 'amber' }, { icon: Sparkles, accent: 'violet' }, { icon: CalendarCheck, accent: 'sky' }]} size={120} />
        <View style={styles.doneText}>
          <AppText variant="h2">{t.allDoneTitle}</AppText>
          <AppText variant="small" tone="muted">
            {t.allDoneBody}
          </AppText>
        </View>
      </Animated.View>
    );
  }

  const v = jobVisual(job, t);
  const running = workStateOf(job) === 'inProgress';
  const time = [job.timeIn, job.timeOut].filter(Boolean).join(' – ');

  return (
    <Animated.View entering={FadeInDown.springify().damping(16)}>
      <PressableScale onPress={() => onOpen(job)} style={styles.card} scaleTo={0.98} accessibilityLabel={`${t.nextUp}: ${clientName(job)}`}>
        <View style={styles.head}>
          <AppText variant="label" tone="brand">
            {t.nextUp}
          </AppText>
          {running ? <Pulse color={accents.violet.solid} /> : null}
        </View>
        <View style={styles.main}>
          <IconBubble icon={v.icon} accent={v.accent} size="lg" />
          <View style={styles.titles}>
            <AppText variant="h2" numberOfLines={1}>
              {clientName(job)}
            </AppText>
            <AppText variant="small" tone="muted" numberOfLines={2}>
              {job.address}
            </AppText>
          </View>
        </View>
        <View style={styles.foot}>
          <AppText variant="bodyStrong" style={running ? styles.running : styles.when}>
            {running ? fmt(t.inProgressSince, { time: fmtTime(job.employeeStartedAt) }) : fmt(t.startsAt, { time: time || t.noDate })}
          </AppText>
          <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
            <AppText variant="caption" tone="inverse">
              {t.openJob}
            </AppText>
            <ArrowRight size={16} color={colors.white} />
          </LinearGradient>
        </View>
      </PressableScale>
    </Animated.View>
  );
}
