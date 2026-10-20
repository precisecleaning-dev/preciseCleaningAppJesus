import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, CircleCheckBig, CloudCheck, CloudUpload, House, LogOut, RefreshCw, type LucideIcon } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import StatusScrim from '../components/StatusScrim';
import AppText from '../components/ui/AppText';
import Button from '../components/ui/Button';
import Chip from '../components/ui/Chip';
import GradientHeader from '../components/ui/GradientHeader';
import IconBubble from '../components/ui/IconBubble';
import { useCatalogs } from '../context/CatalogsContext';
import { useJobs } from '../context/JobsContext';
import { useOutbox } from '../context/OutboxContext';
import { usePhotoQueue } from '../context/PhotoQueueContext';
import { useCurrentUser, useSession } from '../context/SessionContext';
import { colors, gradients, type AccentName } from '../theme/tokens';
import { workStateOf } from '../utils/jobState';
import { initialsOf } from '../utils/ids';
import { findRelation } from '../utils/relations';
import { styles } from './ProfileScreen.styles';
import { fmt, t } from '../constants/strings';

function Stat({ icon, accent, value, label }: { icon: LucideIcon; accent: AccentName; value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <IconBubble icon={icon} accent={accent} size="sm" />
      <AppText style={styles.statValue}>{value}</AppText>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

export default function ProfileScreen() {
  const user = useCurrentUser();
  const { role, signOut } = useSession();
  const { teams } = useCatalogs();
  const { jobs } = useJobs();
  const { queue, retryAll, current } = usePhotoQueue();
  const { pendingCount } = useOutbox();
  const team = findRelation(teams, user.teamId);
  const failed = queue.filter((q) => q.blocked || q.attempts > 0);
  const done = jobs.filter((j) => workStateOf(j) === 'finished').length;
  const photos = jobs.reduce((s, j) => s + (j.beforePhotos?.length || 0) + (j.afterPhotos?.length || 0), 0);
  const synced = queue.length === 0 && pendingCount === 0;
  const initials = initialsOf(user);

  return (
    <View style={styles.screen}>
      <StatusScrim />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GradientHeader overlap={56}>
          <AppText variant="h1" tone="inverse">
            {t.profileTitle}
          </AppText>
          <View style={styles.identity}>
            <LinearGradient colors={gradients.violet} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ring}>
              <View style={styles.avatar}>
                <AppText variant="h1" tone="brand">
                  {initials}
                </AppText>
              </View>
            </LinearGradient>
            <View style={styles.flex}>
              <AppText variant="h2" tone="inverse" numberOfLines={1}>
                {user.firstName} {user.lastName}
              </AppText>
              <AppText variant="small" tone="inverseMuted" numberOfLines={1}>
                {user.email}
              </AppText>
              <View style={styles.tags}>
                {!!role?.name && <Chip label={role.name} accent="violet" solid />}
                {!!team?.name && <Chip label={team.name} color={team.color} onDark />}
              </View>
            </View>
          </View>
        </GradientHeader>

        <View style={[styles.card, styles.statsCard]}>
          <Stat icon={House} accent="sky" value={jobs.length} label={t.statJobs} />
          <View style={styles.vr} />
          <Stat icon={CircleCheckBig} accent="mint" value={done} label={t.statDone} />
          <View style={styles.vr} />
          <Stat icon={Camera} accent="amber" value={photos} label={t.statPhotosUp} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <IconBubble icon={synced ? CloudCheck : CloudUpload} accent={synced ? 'mint' : 'amber'} size="sm" />
            <AppText variant="title">{t.sync}</AppText>
          </View>
          {synced ? (
            <AppText variant="body" tone="success">
              {t.allSynced}
            </AppText>
          ) : (
            <View style={styles.syncList}>
              {queue.length > 0 && (
                <AppText variant="body">
                  {fmt(t.pendingUploads, { n: queue.length })}
                  {current ? ` · ${fmt(t.uploading, { pct: Math.round(current.progress * 100) })}` : ''}
                </AppText>
              )}
              {pendingCount > 0 && <AppText variant="body">{fmt(t.pendingChanges, { n: pendingCount })}</AppText>}
              {failed.slice(0, 3).map((q) => (
                <AppText key={q.id} variant="caption" tone="danger" numberOfLines={1}>
                  {q.label} · {q.lastError}
                </AppText>
              ))}
              {failed.length > 0 && <Button variant="soft" size="sm" label={t.retryNow} onPress={retryAll} icon={<RefreshCw size={16} color={colors.primaryDark} />} />}
            </View>
          )}
        </View>

        <View style={styles.signOut}>
          <Button variant="outline" label={t.signOut} onPress={signOut} icon={<LogOut size={18} color={colors.primary} />} />
          <AppText variant="caption" tone="soft" center>
            {t.appName} · {fmt(t.version, { v: Constants.expoConfig?.version || '' })}
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}
