// src/components/JobCard.tsx
import { Camera, ChevronRight, Clock, MapPin } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useJobs } from '../context/JobsContext';
import { useLanguage } from '../context/LanguageContext';
import { usePhotoQueue } from '../context/PhotoQueueContext';
import { useSession } from '../context/SessionContext';
import { colors } from '../theme/tokens';
import type { Property } from '../types';
import { formatDate } from '../utils/dateFormat';
import { isOverdue, workStateOf } from '../utils/jobState';
import { styles } from './JobCard.styles';
import StatusPill from './StatusPill';

interface Props {
  job: Property;
  onPress: (job: Property) => void;
}

export default function JobCard({ job, onPress }: Props) {
  const { t } = useLanguage();
  const { clientName, serviceName, statusOf } = useJobs();
  const { isElementVisible } = useSession();
  const { pendingFor } = usePhotoQueue();
  const state = workStateOf(job);
  const status = statusOf(job);
  const pending = pendingFor(job.id).length;
  const photos = (job.beforePhotos?.length || 0) + (job.afterPhotos?.length || 0);
  const time = [job.timeIn, job.timeOut].filter(Boolean).join(' – ');

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(job)}
      style={({ pressed }) => [styles.card, state === 'inProgress' && styles.cardActive, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <Text style={styles.client} numberOfLines={1}>
          {clientName(job)}
        </Text>
        <ChevronRight size={20} color={colors.textSoft} />
      </View>

      <View style={styles.line}>
        <MapPin size={15} color={colors.textMuted} />
        <Text style={styles.address} numberOfLines={2}>
          {job.address || '—'}
        </Text>
      </View>

      <View style={styles.line}>
        <Clock size={15} color={colors.textMuted} />
        <Text style={styles.meta}>
          {formatDate(job.scheduleDate || job.receiveDate) || t.noDate}
          {time && isElementVisible('timeIn') ? ` · ${time}` : ''}
          {isElementVisible('serviceId') ? ` · ${serviceName(job)}` : ''}
        </Text>
      </View>

      <View style={styles.pills}>
        {isElementVisible('statusId') && status && <StatusPill label={status.name} color={status.color} />}
        {state === 'inProgress' && <StatusPill label={t.inProgress} tone="progress" />}
        {state === 'finished' && <StatusPill label={t.finished} tone="done" />}
        {isOverdue(job) && <StatusPill label={t.overdue} tone="warning" />}
        {(photos > 0 || pending > 0) && (
          <View style={styles.photoCount}>
            <Camera size={14} color={colors.textMuted} />
            <Text style={styles.photoCountText}>
              {photos}
              {pending > 0 ? ` (+${pending})` : ''}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
