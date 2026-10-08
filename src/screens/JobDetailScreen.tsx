// src/screens/JobDetailScreen.tsx
// ⭐ Ficha de trabajo. Reglas tomadas de HousesView.tsx (web):
//    · Start Job → habilita las fotos (para roles sin Edit en Houses).
//    · Mark Finished exige Start Job y al menos una foto Before y una After.
//    · Solo quien marcó Start/Finished (o un admin) puede deshacerlo.
//    · Botones, campos y secciones respetan "Field & Button Visibility" por rol.
//
//    Diseño: encabezado con degradado (cliente + dirección + "Cómo llegar"),
//    tarjeta de avance de 4 pasos montada sobre el borde, mosaico de datos con
//    color, fotos con anillo de progreso, notas, y una barra de acción fija
//    abajo que cambia según el paso. Al terminar: confeti.
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Bath,
  BedDouble,
  CalendarDays,
  CircleCheckBig,
  CirclePlay,
  Clock,
  Flag,
  MapPinOff,
  Lock,
  Navigation,
  RotateCcw,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Linking, Platform, ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Celebration from '../components/Celebration';
import NoteThread from '../components/NoteThread';
import PhotoSection from '../components/PhotoSection';
import ScreenTopBar from '../components/ScreenTopBar';
import StatusScrim from '../components/StatusScrim';
import WorkProgress from '../components/WorkProgress';
import AppText from '../components/ui/AppText';
import Button from '../components/ui/Button';
import Chip from '../components/ui/Chip';
import EmptyState from '../components/ui/EmptyState';
import IconBubble from '../components/ui/IconBubble';
import PressableScale from '../components/ui/PressableScale';
import { useCatalogs } from '../context/CatalogsContext';
import { useJobs } from '../context/JobsContext';
import { useLanguage } from '../context/LanguageContext';
import { useOutbox } from '../context/OutboxContext';
import { usePhotoQueue } from '../context/PhotoQueueContext';
import { useCurrentUser, useSession } from '../context/SessionContext';
import { fmt } from '../i18n/strings';
import type { RootStackParams } from '../navigation/types';
import { canUndoMark, missingPhotoKinds, type MarkKind } from '../services/jobsService';
import { accents, colors, gradients, type AccentName } from '../theme/tokens';
import { formatDate, formatDateTime } from '../utils/dateFormat';
import { jobVisual } from '../utils/jobVisual';
import { findRelation } from '../utils/relations';
import { styles } from './JobDetailScreen.styles';

type Props = NativeStackScreenProps<RootStackParams, 'JobDetail'>;

const confirm = (title: string, message: string, okLabel: string, cancelLabel: string) =>
  new Promise<boolean>((resolve) =>
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      { text: okLabel, onPress: () => resolve(true) },
    ]),
  );

export default function JobDetailScreen({ route, navigation }: Props) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const user = useCurrentUser();
  const { isSuperAdmin, housesPermission, isElementVisible, isFieldReadOnly } = useSession();
  const { getJob, clientName, serviceName, statusOf, logLabel } = useJobs();
  const { teams, priorities } = useCatalogs();
  const { pendingFor } = usePhotoQueue();
  const { mark, addNote, pendingNotes } = useOutbox();
  const [celebrate, setCelebrate] = useState(0);
  // Con el teclado abierto (escribiendo una nota) se oculta la barra de acción fija.
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const job = getJob(route.params.jobId);

  if (!job) {
    // La casa ya no está asignada a este empleado (o se borró desde la web).
    return (
      <View style={styles.screen}>
        <ScreenTopBar title={t.house} onBack={() => navigation.goBack()} />
        <EmptyState icon={MapPinOff} gradient={gradients.amber} orbits={[{ icon: Flag, accent: 'coral' }, { icon: Clock, accent: 'sky' }, { icon: Users, accent: 'violet' }]} title={t.jobGone} />
      </View>
    );
  }

  const v = jobVisual(job, t);
  const status = statusOf(job);
  const team = findRelation(teams, job.teamId);
  const priority = findRelation(priorities, job.priorityId);
  const label = logLabel(job);
  const client = clientName(job);
  const started = !!job.employeeStartedAt;
  const finished = !!job.employeeFinishedAt;
  const isEmployeeRole = !isSuperAdmin && !housesPermission?.canEdit;
  const photosUnlocked = !isEmployeeRole || started || finished || (job.beforePhotos?.length || 0) + (job.afterPhotos?.length || 0) > 0;
  const missing = missingPhotoKinds(job);
  const queuedCount = pendingFor(job.id).length;

  const run = (kind: MarkKind) => {
    mark(job, kind, label)
      .then(() => {
        if (kind === 'finish') setCelebrate((c) => c + 1);
      })
      .catch((err) => Alert.alert(t.error, String((err as Error)?.message || err)));
  };

  const onStart = async () => {
    if (started) {
      if (!canUndoMark(job.employeeStartedById, job.employeeStartedBy, user, isSuperAdmin)) return Alert.alert(t.undoStart, t.onlyOwnerCanUndo);
      if (await confirm(t.undoStart, t.confirmUndoStart, t.confirm, t.cancel)) run('undoStart');
      return;
    }
    if (await confirm(t.startJob, t.confirmStart, t.startJob, t.cancel)) run('start');
  };

  const onFinish = async () => {
    if (finished) {
      if (!canUndoMark(job.employeeFinishedById, job.employeeFinishedBy, user, isSuperAdmin)) return Alert.alert(t.undoFinish, t.onlyOwnerCanUndo);
      if (await confirm(t.undoFinish, t.confirmUndoFinish, t.confirm, t.cancel)) run('undoFinish');
      return;
    }
    if (!started) return Alert.alert(t.finishJob, t.startFirst);
    if (missing.length > 0) return Alert.alert(t.finishJob, fmt(t.missingPhotos, { list: missing.join(' / ') }));
    if (await confirm(t.finishJob, t.confirmFinish, t.finishJob, t.cancel)) run('finish');
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

  type Tile = { k: string; icon: LucideIcon; accent: AccentName; label: string; value: string };
  const allTiles: Tile[] = [
    { k: 'scheduleDate', icon: CalendarDays, accent: 'sky', label: t.scheduleDate, value: formatDate(job.scheduleDate || job.receiveDate) || t.noDate },
    { k: 'timeIn', icon: Clock, accent: 'violet', label: t.time, value: [job.timeIn, job.timeOut].filter(Boolean).join(' – ') },
    { k: 'serviceId', icon: Sparkles, accent: 'teal', label: t.service, value: serviceName(job) },
    { k: 'teamId', icon: Users, accent: 'brand', label: t.team, value: team?.name || '' },
    { k: 'rooms', icon: BedDouble, accent: 'amber', label: t.rooms, value: job.rooms },
    { k: 'bathrooms', icon: Bath, accent: 'sky', label: t.bathrooms, value: job.bathrooms },
    { k: 'priorityId', icon: Flag, accent: 'coral', label: t.priority, value: priority?.name || '' },
  ];
  const tiles = allTiles.filter((d) => isElementVisible(d.k) && String(d.value || '').trim() !== '');

  const showPhotos = isElementVisible('card_photos') && isElementVisible('btn_tabMedia');
  const canAddPhotos = photosUnlocked && !isFieldReadOnly('beforePhotos');
  const showStart = isElementVisible('btn_startJob');
  const showFinish = isElementVisible('btn_markFinished');
  const photoProps = { propertyId: job.id, clientName: client, address: job.address, label };

  return (
    <View style={styles.screen}>
      <StatusScrim />
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={{ paddingBottom: (keyboardOpen ? 24 : 150) + insets.bottom }}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          {/* El encabezado va DENTRO del scroll: así la tarjeta de avance puede montarse sobre su borde sin recortarse. */}
        <ScreenTopBar title={client} subtitle={job.address} onBack={() => navigation.goBack()} overlap={58}>
          <View style={styles.headChips}>
            {isElementVisible('statusId') && status && <Chip label={status.name} color={status.color} onDark />}
            <Chip label={v.label} accent={v.accent} solid />
            <PressableScale onPress={openMaps} style={styles.mapsBtn} accessibilityRole="link" accessibilityLabel={t.openMaps}>
              <Navigation size={15} color={colors.white} />
              <AppText variant="caption" tone="inverse">
                {t.openMaps}
              </AppText>
            </PressableScale>
          </View>
        </ScreenTopBar>
          <View style={styles.content}>
          <Animated.View entering={FadeInDown.springify().damping(16)} style={[styles.card, styles.progressCard]}>
            <WorkProgress started={started} photosOk={missing.length === 0} finished={finished} />
            {(started || finished) && (
              <View style={styles.logs}>
                {started && (
                  <AppText variant="caption" tone="muted">
                    {fmt(t.startedBy, { name: job.employeeStartedBy || '', when: formatDateTime(job.employeeStartedAt) })}
                  </AppText>
                )}
                {finished && (
                  <AppText variant="caption" tone="muted">
                    {fmt(t.finishedBy, { name: job.employeeFinishedBy || '', when: formatDateTime(job.employeeFinishedAt) })}
                  </AppText>
                )}
              </View>
            )}
          </Animated.View>

          {finished && (
            <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.doneBanner}>
              <IconBubble icon={CircleCheckBig} accent="mint" solid size="lg" />
              <View style={styles.flex}>
                <AppText variant="h2" tone="success">
                  {t.jobDoneTitle}
                </AppText>
                <AppText variant="small" tone="body">
                  {t.jobDoneBody}
                </AppText>
              </View>
            </Animated.View>
          )}

          {showPhotos && (
            <Animated.View entering={FadeInDown.delay(80).springify().damping(16)} style={[styles.card, styles.gapLg]}>
              <AppText variant="h2">{t.photos}</AppText>
              {!photosUnlocked && (
                <View style={styles.lock}>
                  <Lock size={16} color={accents.amber.ink} />
                  <AppText variant="small" tone="warning" style={styles.flex}>
                    {t.photosLocked}
                  </AppText>
                </View>
              )}
              <PhotoSection kind="before" urls={job.beforePhotos || []} canAdd={canAddPhotos} {...photoProps} />
              <View style={styles.divider} />
              <PhotoSection kind="after" urls={job.afterPhotos || []} canAdd={canAddPhotos} {...photoProps} />
            </Animated.View>
          )}

          {tiles.length > 0 && (
            <Animated.View entering={FadeInDown.delay(140).springify().damping(16)} style={styles.card}>
              <AppText variant="h2" style={styles.cardTitle}>
                {t.details}
              </AppText>
              <View style={styles.tiles}>
                {tiles.map((d) => (
                  <View key={d.k} style={styles.tile}>
                    <IconBubble icon={d.icon} accent={d.accent} size="sm" />
                    <View style={styles.flex}>
                      <AppText variant="caption" tone="muted">
                        {d.label}
                      </AppText>
                      <AppText variant="bodyStrong" numberOfLines={2}>
                        {d.value}
                      </AppText>
                    </View>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {(isElementVisible('note') || isElementVisible('employeeNote')) && (
            <Animated.View entering={FadeInDown.delay(200).springify().damping(16)} style={[styles.card, styles.gapLg]}>
              {isElementVisible('note') && (
                <NoteThread title={t.generalNote} field="note" legacyText={job.note || ''} history={job.notesHistory || []} myEmail={user.email} canWrite={false} />
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
            </Animated.View>
          )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Barra de acción fija: siempre a un pulgar de distancia */}
      {(showStart || showFinish) && !keyboardOpen && (
        <Animated.View entering={FadeIn.delay(250)} style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          {!started && !finished && showStart && <Button label={t.startJob} size="lg" onPress={onStart} icon={<CirclePlay size={22} color={colors.white} />} />}
          {started && !finished && (
            <>
              {showFinish && (
                <Button label={t.finishJob} size="lg" variant="success" onPress={onFinish} disabled={missing.length > 0} icon={<CircleCheckBig size={22} color={colors.white} />} />
              )}
              {missing.length > 0 && (
                <AppText variant="caption" tone="warning" center>
                  {fmt(t.missingPhotos, { list: missing.join(' / ') })}
                  {queuedCount > 0 ? ` · ${fmt(t.queued, { n: queuedCount })}` : ''}
                </AppText>
              )}
              {showStart && <Button label={t.undoStart} size="sm" variant="ghost" onPress={onStart} icon={<RotateCcw size={16} color={colors.primary} />} />}
            </>
          )}
          {finished && showFinish && <Button label={t.undoFinish} size="sm" variant="ghost" onPress={onFinish} icon={<RotateCcw size={16} color={colors.primary} />} />}
        </Animated.View>
      )}

      {celebrate > 0 && <Celebration key={celebrate} />}
    </View>
  );
}
