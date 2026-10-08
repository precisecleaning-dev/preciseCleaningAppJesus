// src/screens/HomeScreen.tsx
// ⭐ INICIO del empleado.
//    · Encabezado con degradado: saludo según la hora, campana con contador y
//      tres indicadores de color (hoy, en curso, fotos por subir).
//    · "Tu próxima casa" montada sobre el borde del encabezado.
//    · Pestañas Hoy / Próximas / Historial con indicador deslizante.
//    · Tarjetas que entran en cascada; esqueletos animados mientras carga.
//    Los datos llegan en vivo: cuando la oficina asigna una casa, aparece sola.
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Bell, CalendarCheck, CalendarClock, CalendarDays, CirclePlay, CloudUpload, History, House, Sparkles, type LucideIcon } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import JobCard from '../components/JobCard';
import NextJobCard from '../components/NextJobCard';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import StatusScrim from '../components/StatusScrim';
import AppText from '../components/ui/AppText';
import EmptyState from '../components/ui/EmptyState';
import GradientHeader from '../components/ui/GradientHeader';
import IconButton from '../components/ui/IconButton';
import SegmentedTabs from '../components/ui/SegmentedTabs';
import { JobCardSkeleton } from '../components/ui/Skeleton';
import { useJobs } from '../context/JobsContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationsContext';
import { usePhotoQueue } from '../context/PhotoQueueContext';
import { useCurrentUser } from '../context/SessionContext';
import type { Strings } from '../i18n/strings';
import type { RootStackParams, TabParams } from '../navigation/types';
import { accents, colors, gradients, motion, type AccentName } from '../theme/tokens';
import type { Property } from '../types';
import { dateSortValue } from '../utils/dateFormat';
import { segmentOf, workStateOf, type Segment } from '../utils/jobState';
import { styles } from './HomeScreen.styles';

type Props = CompositeScreenProps<BottomTabScreenProps<TabParams, 'Home'>, NativeStackScreenProps<RootStackParams>>;

const HISTORY_LIMIT = 100;

const greeting = (t: Strings, h = new Date().getHours()) => (h < 12 ? t.greetingMorning : h < 19 ? t.greetingAfternoon : t.greetingEvening);

function Stat({ icon: Icon, value, label, accent, delay }: { icon: LucideIcon; value: number; label: string; accent: AccentName; delay: number }) {
  return (
    <Animated.View entering={FadeInUp.delay(delay).springify().damping(16)} style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: accents[accent].solid }]}>
        <Icon size={16} color={colors.white} strokeWidth={2.4} />
      </View>
      <AnimatedNumber value={value} prefix="" decimals={0} duration={700} style={styles.statValue} />
      <AppText variant="caption" tone="inverseMuted" numberOfLines={1}>
        {label}
      </AppText>
    </Animated.View>
  );
}

export default function HomeScreen({ navigation }: Props) {
  const { t, lang } = useLanguage();
  const user = useCurrentUser();
  const { jobs, jobsLoaded } = useJobs();
  const { queue, pendingFor } = usePhotoQueue();
  const { unread } = useNotifications();
  const [segment, setSegment] = useState<Segment>('today');
  const [refreshing, setRefreshing] = useState(false);

  const grouped = useMemo(() => {
    const out: Record<Segment, Property[]> = { today: [], upcoming: [], history: [] };
    const now = new Date();
    jobs.forEach((j) => out[segmentOf(j, now)].push(j));
    const when = (j: Property) => dateSortValue(j.scheduleDate || j.receiveDate);
    out.today.sort(
      (a, b) =>
        Number(workStateOf(b) === 'inProgress') - Number(workStateOf(a) === 'inProgress') ||
        Number(workStateOf(a) === 'finished') - Number(workStateOf(b) === 'finished') ||
        when(a) - when(b) ||
        String(a.timeIn || '').localeCompare(String(b.timeIn || '')),
    );
    out.upcoming.sort((a, b) => when(a) - when(b));
    out.history = out.history.sort((a, b) => when(b) - when(a)).slice(0, HISTORY_LIMIT);
    return out;
  }, [jobs]);

  const inProgress = grouped.today.filter((j) => workStateOf(j) === 'inProgress').length;
  const nextJob = grouped.today.find((j) => workStateOf(j) !== 'finished') ?? null;
  const openJob = useCallback((j: Property) => navigation.navigate('JobDetail', { jobId: j.id }), [navigation]);

  const onRefresh = () => {
    // Los datos ya llegan en vivo; esto solo da la sensación de "actualizado".
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
  };

  const rawDate = new Date().toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  // Solo la primera letra en mayúscula ("Jueves, 8 de octubre", no "De Octubre").
  const today = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

  const empty = {
    today: { title: t.noJobsTodayTitle, body: t.noJobsTodayBody, icon: CalendarCheck, gradient: gradients.brand },
    upcoming: { title: t.noUpcomingTitle, body: t.noUpcomingBody, icon: CalendarClock, gradient: gradients.violet },
    history: { title: t.noHistoryTitle, body: t.noHistoryBody, icon: History, gradient: gradients.mint },
  }[segment];

  const header = (
    <View>
      <GradientHeader overlap={70}>
        <View style={styles.topRow}>
          <View style={styles.avatar}>
            <AppText variant="title" tone="inverse">
              {initials}
            </AppText>
          </View>
          <View style={styles.hello}>
            <AppText variant="small" tone="inverseMuted">
              {today}
            </AppText>
            <AppText variant="h1" tone="inverse" numberOfLines={1}>
              {greeting(t)}, {user.firstName}
            </AppText>
          </View>
          <IconButton icon={Bell} onPress={() => navigation.navigate('Notifications')} label={t.notifTitle} badge={unread} />
        </View>
        <View style={styles.stats}>
          <Stat icon={CalendarDays} value={grouped.today.length} label={t.statToday} accent="sky" delay={80} />
          <Stat icon={CirclePlay} value={inProgress} label={t.statInProgress} accent="violet" delay={160} />
          <Stat icon={CloudUpload} value={queue.length} label={t.statPhotos} accent="amber" delay={240} />
        </View>
      </GradientHeader>
      <View style={styles.overlap}>
        {jobsLoaded ? <NextJobCard job={nextJob} onOpen={openJob} /> : <JobCardSkeleton />}
      </View>
      <View style={styles.tabs}>
        <SegmentedTabs
          value={segment}
          onChange={setSegment}
          options={[
            { value: 'today', label: t.segToday, count: grouped.today.length },
            { value: 'upcoming', label: t.segUpcoming, count: grouped.upcoming.length },
            { value: 'history', label: t.segHistory },
          ]}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <StatusScrim />
      <FlatList
        data={jobsLoaded ? grouped[segment] : []}
        keyExtractor={(j) => j.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * motion.stagger).springify().damping(18)} style={styles.item}>
            <JobCard job={item} pending={pendingFor(item.id).length} onPress={openJob} />
          </Animated.View>
        )}
        ListEmptyComponent={
          jobsLoaded ? (
            <EmptyState
              icon={empty.icon}
              gradient={empty.gradient}
              orbits={[{ icon: House, accent: 'sky' }, { icon: Sparkles, accent: 'amber' }, { icon: Bell, accent: 'coral' }]}
              title={empty.title}
              body={empty.body}
            />
          ) : (
            <View style={styles.skeletons}>
              <JobCardSkeleton />
              <JobCardSkeleton />
              <JobCardSkeleton />
            </View>
          )
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        initialNumToRender={8}
        windowSize={7}
      />
    </View>
  );
}
