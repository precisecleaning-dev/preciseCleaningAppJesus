import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Bell, CalendarCheck, CalendarClock, CalendarDays, CirclePlay, CloudUpload, History, House, Sparkles, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, View } from 'react-native';
import JobCard from '../components/JobCard';
import NextJobCard from '../components/NextJobCard';
import StatusScrim from '../components/StatusScrim';
import AppText from '../components/ui/AppText';
import EmptyState from '../components/ui/EmptyState';
import GradientHeader from '../components/ui/GradientHeader';
import IconButton from '../components/ui/IconButton';
import SegmentedTabs from '../components/ui/SegmentedTabs';
import { JobCardSkeleton } from '../components/ui/Skeleton';
import { texts } from '../constants/texts';
import { useJobs } from '../context/JobsContext';
import { useNotifications } from '../context/NotificationsContext';
import { usePhotoQueue } from '../context/PhotoQueueContext';
import { useCurrentUser } from '../context/SessionContext';
import { useNow } from '../hooks/useNow';
import { useTabBarSpace } from '../hooks/useTabBarSpace';
import type { RootStackParams, TabParams } from '../navigation/types';
import { styles } from '../styles/HomeScreen.styles';
import { solidBg } from '../theme/accentStyles';
import { colors, gradients, type AccentName } from '../theme/tokens';
import type { Property } from '../types';
import { formatDate } from '../utils/dateFormat';
import { initialsOf } from '../utils/ids';
import { groupJobs, workStateOf, type Segment } from '../utils/jobState';

type Props = CompositeScreenProps<BottomTabScreenProps<TabParams, 'Home'>, NativeStackScreenProps<RootStackParams>>;

const greeting = (h: number) => (h < 12 ? texts.greetingMorning : h < 19 ? texts.greetingAfternoon : texts.greetingEvening);

function Stat({ icon: Icon, value, label, accent }: { icon: LucideIcon; value: number; label: string; accent: AccentName }) {
  return (
    <View style={styles.stat}>
      <View style={[styles.statIcon, solidBg[accent]]}>
        <Icon size={16} color={colors.white} strokeWidth={2.4} />
      </View>
      <AppText style={styles.statValue}>{value}</AppText>
      <AppText variant="caption" tone="inverseMuted" numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

export default function HomeScreen({ navigation }: Props) {
  const user = useCurrentUser();
  const { jobs, jobsLoaded } = useJobs();
  const { queue, pendingFor } = usePhotoQueue();
  const { unread } = useNotifications();
  const [segment, setSegment] = useState<Segment>('today');

  const now = useNow();
  const tabBarSpace = useTabBarSpace();
  const grouped = groupJobs(jobs, now);

  const inProgress = grouped.today.filter((j) => workStateOf(j) === 'inProgress').length;
  const nextJob = grouped.today.find((j) => workStateOf(j) !== 'finished') ?? null;
  const openJob = (j: Property) => navigation.navigate('JobDetail', { jobId: j.id });

  const today = `${texts.weekdays[now.getDay()]}, ${formatDate(now)}`;
  const initials = initialsOf(user);

  const empty = {
    today: { title: texts.noJobsTodayTitle, body: texts.noJobsTodayBody, icon: CalendarCheck, gradient: gradients.brand },
    upcoming: { title: texts.noUpcomingTitle, body: texts.noUpcomingBody, icon: CalendarClock, gradient: gradients.violet },
    history: { title: texts.noHistoryTitle, body: texts.noHistoryBody, icon: History, gradient: gradients.mint },
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
              {greeting(now.getHours())}, {user.firstName}
            </AppText>
          </View>
          <IconButton icon={Bell} onPress={() => navigation.navigate('Notifications')} label={texts.notifTitle} badge={unread} />
        </View>
        <View style={styles.stats}>
          <Stat icon={CalendarDays} value={grouped.today.length} label={texts.statToday} accent="sky" />
          <Stat icon={CirclePlay} value={inProgress} label={texts.statInProgress} accent="violet" />
          <Stat icon={CloudUpload} value={queue.length} label={texts.statPhotos} accent="amber" />
        </View>
      </GradientHeader>
      <View style={styles.overlap}>{jobsLoaded ? <NextJobCard job={nextJob} onOpen={openJob} /> : <JobCardSkeleton />}</View>
      <View style={styles.tabs}>
        <SegmentedTabs
          value={segment}
          onChange={setSegment}
          options={[
            { value: 'today', label: texts.segToday, count: grouped.today.length },
            { value: 'upcoming', label: texts.segUpcoming, count: grouped.upcoming.length },
            { value: 'history', label: texts.segHistory },
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
        contentContainerStyle={{ paddingBottom: tabBarSpace }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <JobCard job={item} pending={pendingFor(item.id).length} onPress={openJob} />
          </View>
        )}
        ListEmptyComponent={
          jobsLoaded ? (
            <EmptyState
              icon={empty.icon}
              gradient={empty.gradient}
              orbits={[
                { icon: House, accent: 'sky' },
                { icon: Sparkles, accent: 'amber' },
                { icon: Bell, accent: 'coral' },
              ]}
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
        initialNumToRender={8}
        windowSize={7}
      />
    </View>
  );
}
