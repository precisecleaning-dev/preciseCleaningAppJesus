// src/screens/JobsScreen.tsx
// ⭐ Lista de casas asignadas al empleado, en tiempo real, en tres pestañas:
//    Hoy (incluye en curso y atrasadas recientes), Próximas e Historial.
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import JobCard from '../components/JobCard';
import OfflineBanner from '../components/OfflineBanner';
import Segmented from '../components/Segmented';
import { ui } from '../components/ui.styles';
import { useJobs } from '../context/JobsContext';
import { useLanguage } from '../context/LanguageContext';
import type { JobsStackParams } from '../navigation/types';
import { colors } from '../theme/tokens';
import { dateSortValue } from '../utils/dateFormat';
import { segmentOf, workStateOf, type Segment } from '../utils/jobState';

type Props = NativeStackScreenProps<JobsStackParams, 'Jobs'>;

const HISTORY_LIMIT = 100;

export default function JobsScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const { jobs, jobsLoaded } = useJobs();
  const [segment, setSegment] = useState<Segment>('today');
  const [refreshing, setRefreshing] = useState(false);

  const grouped = useMemo(() => {
    const out: Record<Segment, typeof jobs> = { today: [], upcoming: [], history: [] };
    const now = new Date();
    jobs.forEach((j) => out[segmentOf(j, now)].push(j));
    const when = (j: (typeof jobs)[number]) => dateSortValue(j.scheduleDate || j.receiveDate);
    // Hoy: primero las que están en curso, luego por fecha/hora ascendente.
    out.today.sort(
      (a, b) =>
        Number(workStateOf(b) === 'inProgress') - Number(workStateOf(a) === 'inProgress') ||
        when(a) - when(b) ||
        String(a.timeIn || '').localeCompare(String(b.timeIn || '')),
    );
    out.upcoming.sort((a, b) => when(a) - when(b));
    out.history.sort((a, b) => when(b) - when(a));
    out.history = out.history.slice(0, HISTORY_LIMIT);
    return out;
  }, [jobs]);

  // Los datos ya llegan en vivo; el pull-to-refresh solo da feedback al usuario.
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <View style={ui.screen}>
      <OfflineBanner />
      <Segmented
        value={segment}
        onChange={setSegment}
        options={[
          { value: 'today', label: t.segToday, count: grouped.today.length },
          { value: 'upcoming', label: t.segUpcoming, count: grouped.upcoming.length },
          { value: 'history', label: t.segDone },
        ]}
      />
      {!jobsLoaded ? (
        <View style={ui.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={grouped[segment]}
          keyExtractor={(j) => j.id}
          contentContainerStyle={ui.listContent}
          renderItem={({ item }) => <JobCard job={item} onPress={(j) => navigation.navigate('JobDetail', { jobId: j.id })} />}
          ListEmptyComponent={<Text style={ui.empty}>{t.noJobs}</Text>}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        />
      )}
    </View>
  );
}
