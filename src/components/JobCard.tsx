// src/components/JobCard.tsx
// ⭐ Tarjeta de casa. Franja izquierda con el color del status que configuró la
//    oficina, burbuja con el color del estado de trabajo, y chips de horario,
//    servicio y fotos. Memoizada: la lista no se re-dibuja entera en cada cambio.
import { Camera, ChevronRight, Clock, MapPin, Sparkles } from 'lucide-react-native';
import { memo } from 'react';
import { View } from 'react-native';
import { useJobs } from '../context/JobsContext';
import { useLanguage } from '../context/LanguageContext';
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
import PressableScale from './ui/PressableScale';

interface Props {
  job: Property;
  pending: number;
  onPress: (job: Property) => void;
}

function JobCard({ job, pending, onPress }: Props) {
  const { t } = useLanguage();
  const { clientName, serviceName, statusOf } = useJobs();
  const { isElementVisible } = useSession();
  const v = jobVisual(job, t);
  const status = statusOf(job);
  const stripe = safeColor(status?.color, accents[v.accent].solid);
  const photos = (job.beforePhotos?.length || 0) + (job.afterPhotos?.length || 0);
  const time = [job.timeIn, job.timeOut].filter(Boolean).join(' – ');
  const client = clientName(job);

  return (
    <PressableScale onPress={() => onPress(job)} style={styles.card} scaleTo={0.97} accessibilityLabel={`${client}, ${job.address}, ${v.label}`}>
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
          <Chip icon={Clock} accent="sky" label={[formatDate(job.scheduleDate || job.receiveDate) || t.noDate, isElementVisible('timeIn') ? time : ''].filter(Boolean).join(' · ')} />
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
    </PressableScale>
  );
}

export default memo(JobCard);
