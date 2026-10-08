// src/screens/JobDetailScreen.tsx
// ⭐ Ficha de trabajo del empleado. Reglas tomadas de HousesView.tsx (web):
//    · Start Job → habilita las fotos (el empleado no carga fotos antes de iniciar).
//    · Mark Finished exige Start Job y al menos una foto Before y una After.
//    · Solo quien marcó Start/Finished (o un admin) puede deshacerlo.
//    · Botones, campos y secciones respetan "Field & Button Visibility" por rol.
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CheckCircle2, MapPin, Navigation, PlayCircle, RotateCcw } from 'lucide-react-native';
import { useLayoutEffect } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import ActionButton from '../components/ActionButton';
import NoteThread from '../components/NoteThread';
import OfflineBanner from '../components/OfflineBanner';
import PhotoSection from '../components/PhotoSection';
import StatusPill from '../components/StatusPill';
import { ui } from '../components/ui.styles';
import { useCatalogs } from '../context/CatalogsContext';
import { useJobs } from '../context/JobsContext';
import { useLanguage } from '../context/LanguageContext';
import { useOutbox } from '../context/OutboxContext';
import { usePhotoQueue } from '../context/PhotoQueueContext';
import { useCurrentUser, useSession } from '../context/SessionContext';
import type { JobsStackParams } from '../navigation/types';
import { canUndoMark, missingPhotoKinds, type MarkKind } from '../services/jobsService';
import { colors } from '../theme/tokens';
import type { Property } from '../types';
import { formatDate, formatDateTime } from '../utils/dateFormat';
import { findRelation } from '../utils/relations';
import { workStateOf } from '../utils/jobState';
import { styles } from './JobDetailScreen.styles';

type Props = NativeStackScreenProps<JobsStackParams, 'JobDetail'>;

const confirm = (title: string, message: string, okLabel: string, cancelLabel: string) =>
  new Promise<boolean>((resolve) =>
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      { text: okLabel, onPress: () => resolve(true) },
    ]),
  );

export default function JobDetailScreen({ route, navigation }: Props) {
  const { t } = useLanguage();
  const user = useCurrentUser();
  const { isSuperAdmin, housesPermission, isElementVisible, isFieldReadOnly } = useSession();
  const { getJob, clientName, serviceName, statusOf, logLabel } = useJobs();
  const { teams, priorities } = useCatalogs();
  const { pendingFor } = usePhotoQueue();
  const { mark, addNote, pendingNotes } = useOutbox();

  const job = getJob(route.params.jobId);

  useLayoutEffect(() => {
    if (job) navigation.setOptions({ title: clientName(job) });
  }, [navigation, job, clientName]);

  if (!job) {
    // La casa ya no está asignada a este empleado (o se borró desde la web).
    return (
      <View style={ui.center}>
        <Text style={ui.empty}>{t.noJobs}</Text>
      </View>
    );
  }

  const state = workStateOf(job);
  const status = statusOf(job);
  const team = findRelation(teams, job.teamId);
  const priority = findRelation(priorities, job.priorityId);
  const label = logLabel(job);
  const started = !!job.employeeStartedAt;
  const finished = !!job.employeeFinishedAt;
  // Misma regla que photosUnlockedFor() en la web: "empleado" = sin Edit en Houses.
  const isEmployeeRole = !isSuperAdmin && !housesPermission?.canEdit;
  const photosUnlocked =
    !isEmployeeRole || started || finished || (job.beforePhotos?.length || 0) + (job.afterPhotos?.length || 0) > 0;
  // Una foto en cola cuenta como "cargada" para el aviso, pero Finish espera a que
  // esté en la nube: la web valida contra las URLs guardadas.
  const missing = missingPhotoKinds(job);
  const queuedCount = pendingFor(job.id).length;

  // El cambio se ve al instante (también sin señal); la cola lo confirma con el servidor.
  const run = (kind: MarkKind) => {
    mark(job, kind, label).catch((err) => {
      console.error(err);
      Alert.alert(t.error, String((err as Error)?.message || err));
    });
  };

  const onStart = async () => {
    if (started) {
      if (!canUndoMark(job.employeeStartedById, job.employeeStartedBy, user, isSuperAdmin)) {
        Alert.alert(t.undoStart, t.onlyOwnerCanUndo);
        return;
      }
      if (await confirm(t.undoStart, t.confirmUndoStart, t.confirm, t.cancel)) {
        run('undoStart');
      }
      return;
    }
    if (await confirm(t.startJob, t.confirmStart, t.startJob, t.cancel)) {
      run('start');
    }
  };

  const onFinish = async () => {
    if (finished) {
      if (!canUndoMark(job.employeeFinishedById, job.employeeFinishedBy, user, isSuperAdmin)) {
        Alert.alert(t.undoFinish, t.onlyOwnerCanUndo);
        return;
      }
      if (await confirm(t.undoFinish, t.confirmUndoFinish, t.confirm, t.cancel)) {
        run('undoFinish');
      }
      return;
    }
    if (!started) {
      Alert.alert(t.finishJob, t.startFirst);
      return;
    }
    if (missing.length > 0) {
      Alert.alert(t.finishJob, `${t.missingPhotos}: ${missing.join(' / ')}`);
      return;
    }
    if (await confirm(t.finishJob, t.confirmFinish, t.finishJob, t.cancel)) {
      run('finish');
    }
  };

  const openMaps = () => {
    const q = encodeURIComponent([job.address, job.city].filter(Boolean).join(', '));
    const url = Platform.OS === 'ios' ? `http://maps.apple.com/?daddr=${q}` : `geo:0,0?q=${q}`;
    Linking.openURL(url).catch(() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`));
  };

  const sendNote = async (text: string) => {
    try {
      await addNote(job.id, text, label);
      return true;
    } catch (err) {
      console.error(err);
      Alert.alert(t.error, t.noteError);
      return false;
    }
  };

  const details: { k: string; label: string; value: string }[] = [
    { k: 'scheduleDate', label: t.scheduleDate, value: formatDate(job.scheduleDate || job.receiveDate) || t.noDate },
    { k: 'timeIn', label: t.time, value: [job.timeIn, job.timeOut].filter(Boolean).join(' – ') },
    { k: 'serviceId', label: t.service, value: serviceName(job) },
    { k: 'rooms', label: t.rooms, value: job.rooms },
    { k: 'bathrooms', label: t.bathrooms, value: job.bathrooms },
    { k: 'teamId', label: t.team, value: team?.name || '' },
    { k: 'priorityId', label: t.priority, value: priority?.name || '' },
  ].filter((d) => isElementVisible(d.k) && String(d.value || '').trim() !== '');

  const photoProps = (p: Property) => ({
    propertyId: p.id,
    clientName: clientName(p),
    address: p.address,
    label,
  });

  const showPhotos = isElementVisible('card_photos') && isElementVisible('btn_tabMedia');
  const canAddPhotos = photosUnlocked && !isFieldReadOnly('beforePhotos');

  return (
    <View style={ui.screen}>
      <OfflineBanner />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Encabezado: dirección + status */}
        <View style={ui.card}>
          <Pressable onPress={openMaps} accessibilityRole="link" style={styles.addressRow}>
            <MapPin size={20} color={colors.primary} />
            <View style={styles.flex}>
              <Text style={styles.address}>{job.address || '—'}</Text>
              <Text style={styles.mapsLink}>{t.openMaps}</Text>
            </View>
            <Navigation size={20} color={colors.primary} />
          </Pressable>
          <View style={styles.pills}>
            {isElementVisible('statusId') && status && <StatusPill label={status.name} color={status.color} />}
            {state === 'inProgress' && <StatusPill label={t.inProgress} tone="progress" />}
            {state === 'finished' && <StatusPill label={t.finished} tone="done" />}
            {state === 'notStarted' && <StatusPill label={t.notStarted} />}
          </View>
        </View>

        {/* Work Log: Start / Finish */}
        <View style={[ui.card, styles.gap]}>
          {isElementVisible('btn_startJob') && (
            <ActionButton
              label={started ? t.undoStart : t.startJob}
              variant={started ? 'outline' : 'primary'}
              icon={started ? <RotateCcw size={18} color={colors.primary} /> : <PlayCircle size={20} color={colors.white} />}
              onPress={onStart}
              disabled={finished && !started}
            />
          )}
          {started && (
            <Text style={ui.muted}>
              {t.startedBy} {job.employeeStartedBy} · {formatDateTime(job.employeeStartedAt)}
            </Text>
          )}
          {isElementVisible('btn_markFinished') && (
            <ActionButton
              label={finished ? t.undoFinish : t.finishJob}
              variant={finished ? 'outline' : 'success'}
              icon={finished ? <RotateCcw size={18} color={colors.primary} /> : <CheckCircle2 size={20} color={colors.white} />}
              onPress={onFinish}
              disabled={!finished && (!started || missing.length > 0)}
            />
          )}
          {finished && (
            <Text style={ui.muted}>
              {t.finishedBy} {job.employeeFinishedBy} · {formatDateTime(job.employeeFinishedAt)}
            </Text>
          )}
          {!finished && started && missing.length > 0 && (
            <Text style={styles.warning}>
              {t.missingPhotos}: {missing.join(' / ')}
              {queuedCount > 0 ? ` · ${queuedCount} ${t.queued}` : ''}
            </Text>
          )}
        </View>

        {/* Fotos */}
        {showPhotos && (
          <View style={[ui.card, styles.gapLg]}>
            <Text style={ui.sectionTitle}>{t.photos}</Text>
            {!photosUnlocked && <Text style={styles.warning}>{t.photosLocked}</Text>}
            <PhotoSection kind="before" urls={job.beforePhotos || []} canAdd={canAddPhotos} {...photoProps(job)} />
            <View style={styles.divider} />
            <PhotoSection kind="after" urls={job.afterPhotos || []} canAdd={canAddPhotos} {...photoProps(job)} />
          </View>
        )}

        {/* Detalles */}
        {details.length > 0 && (
          <View style={ui.card}>
            {details.map((d) => (
              <View key={d.k} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{d.label}</Text>
                <Text style={styles.detailValue}>{d.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Notas (las de oficina nunca se muestran al empleado) */}
        {(isElementVisible('note') || isElementVisible('employeeNote')) && (
          <View style={[ui.card, styles.gapLg]}>
            {isElementVisible('note') && (
              <NoteThread
                title={t.generalNote}
                field="note"
                legacyText={job.note || ''}
                history={job.notesHistory || []}
                myEmail={user.email}
                canWrite={false}
              />
            )}
            {isElementVisible('employeeNote') && (
              <NoteThread
                title={t.employeeNote}
                field="employeeNote"
                legacyText={job.employeeNote || ''}
                history={job.notesHistory || []}
                pending={pendingNotes(job.id)}
                myEmail={user.email}
                canWrite={!isFieldReadOnly('employeeNote')}
                onSend={sendNote}
              />
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
