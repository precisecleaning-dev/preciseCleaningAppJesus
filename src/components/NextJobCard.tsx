import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, CalendarCheck, PartyPopper, Sparkles, Star } from 'lucide-react-native';
import { View } from 'react-native';
import { useJobs } from '../context/JobsContext';
import { colors, gradients } from '../theme/tokens';
import type { Property } from '../types';
import { formatTime } from '../utils/dateFormat';
import { workStateOf } from '../utils/jobState';
import { jobVisual } from '../utils/jobVisual';
import { styles } from './NextJobCard.styles';
import AppText from './ui/AppText';
import Illustration from './ui/Illustration';
import IconBubble from './ui/IconBubble';
import Touchable from './ui/Touchable';
import { fmt, t } from '../constants/strings';

export default function NextJobCard({ job, onOpen }: { job: Property | null; onOpen: (j: Property) => void }) {
  const { clientName } = useJobs();

  if (!job) {
    return (
      <View style={[styles.card, styles.doneCard]}>
        <Illustration
          icon={PartyPopper}
          gradient={gradients.mint}
          orbits={[
            { icon: Star, accent: 'amber' },
            { icon: Sparkles, accent: 'violet' },
            { icon: CalendarCheck, accent: 'sky' },
          ]}
          size={120}
        />
        <View style={styles.doneText}>
          <AppText variant="h2">{t.allDoneTitle}</AppText>
          <AppText variant="small" tone="muted">
            {t.allDoneBody}
          </AppText>
        </View>
      </View>
    );
  }

  const v = jobVisual(job);
  const running = workStateOf(job) === 'inProgress';
  const time = [job.timeIn, job.timeOut].filter(Boolean).join(' – ');

  return (
    <Touchable onPress={() => onOpen(job)} style={styles.card} accessibilityLabel={`${t.nextUp}: ${clientName(job)}`}>
      <View style={styles.head}>
        <AppText variant="label" tone="brand">
          {t.nextUp}
        </AppText>
        {running && <View style={styles.pulseDot} />}
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
          {running ? fmt(t.inProgressSince, { time: formatTime(job.employeeStartedAt) }) : fmt(t.startsAt, { time: time || t.noDate })}
        </AppText>
        <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
          <AppText variant="caption" tone="inverse">
            {t.openJob}
          </AppText>
          <ArrowRight size={16} color={colors.white} />
        </LinearGradient>
      </View>
    </Touchable>
  );
}
