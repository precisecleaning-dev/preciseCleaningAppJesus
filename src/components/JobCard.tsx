import { Camera, ChevronRight, Clock, MapPin, Sparkles } from 'lucide-react-native';
import { View } from 'react-native';
import { texts } from '../constants/texts';
import { useJobs } from '../context/JobsContext';
import { useSession } from '../context/SessionContext';
import { accents, colors } from '../theme/tokens';
import type { Property } from '../types';
import { safeColor } from '../utils/color';
import { formatDate } from '../utils/dateFormat';
import { jobVisual } from '../utils/jobVisual';
import { styles } from './JobCard.styles';
import AppText from './ui/AppText';
import Chip from './ui/Chip';
import IconBubble from './ui/IconBubble';
import Touchable from './ui/Touchable';

interface Props {
  job: Property;
  pending: number;
  onPress: (job: Property) => void;
}

export default function JobCard({ job, pending, onPress }: Props) {
  const { clientName, serviceName, statusOf } = useJobs();
  const { isElementVisible } = useSession();
  const v = jobVisual(job);
  const status = statusOf(job);
  const stripe = safeColor(status?.color, accents[v.accent].solid);
  const photos = (job.beforePhotos?.length || 0) + (job.afterPhotos?.length || 0);
  const time = [job.timeIn, job.timeOut].filter(Boolean).join(' – ');
  const client = clientName(job);

  return (
    <Touchable onPress={() => onPress(job)} style={styles.card} accessibilityLabel={`${client}, ${job.address}, ${v.label}`}>
      <View style={[styles.stripe, { backgroundColor: stripe }]} />
      <View style={styles.body}>
        <View style={styles.top}>
          <IconBubble icon={v.icon} accent={v.accent} />
          <View style={styles.titles}>
            <AppText variant="title" numberOfLines={1}>
              {client}
            </AppText>
            <View style={styles.line}>
              <MapPin size={13} color={colors.textMuted} />
              <AppText variant="small" tone="muted" numberOfLines={1} style={styles.flex}>
                {job.address || '—'}
              </AppText>
            </View>
          </View>
          <ChevronRight size={20} color={colors.textSoft} />
        </View>

        <View style={styles.chips}>
          <Chip
            icon={Clock}
            accent="sky"
            label={[formatDate(job.scheduleDate || job.receiveDate) || texts.noDate, isElementVisible('timeIn') ? time : ''].filter(Boolean).join(' · ')}
          />
          {isElementVisible('serviceId') && <Chip icon={Sparkles} accent="teal" label={serviceName(job)} />}
        </View>

        <View style={styles.footer}>
          {isElementVisible('statusId') && status && <Chip label={status.name} color={status.color} />}
          <Chip label={v.label} accent={v.accent} solid={v.accent !== 'sky'} />
          {(photos > 0 || pending > 0) && (
            <View style={styles.photos}>
              <Camera size={14} color={pending > 0 ? accents.amber.ink : colors.textMuted} />
              <AppText variant="caption" style={pending > 0 ? styles.photosPending : styles.photosText}>
                {photos}
                {pending > 0 ? ` +${pending}` : ''}
              </AppText>
            </View>
          )}
        </View>
      </View>
    </Touchable>
  );
}
