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
import { fmt, texts } from '../constants/texts';
import { useCatalogs } from '../context/CatalogsContext';
import { useJobs } from '../context/JobsContext';
import { useOutbox } from '../context/OutboxContext';
import { usePhotoQueue } from '../context/PhotoQueueContext';
import { useCurrentUser, useSession } from '../context/SessionContext';
import { useTabBarSpace } from '../hooks/useTabBarSpace';
import { styles } from '../styles/ProfileScreen.styles';
import { colors, gradients, type AccentName } from '../theme/tokens';
import { initialsOf } from '../utils/ids';
import { workStateOf } from '../utils/jobState';
import { findRelation } from '../utils/relations';

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
  const tabBarSpace = useTabBarSpace();
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
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: tabBarSpace }]} showsVerticalScrollIndicator={false}>
        <GradientHeader overlap={56}>
          <AppText variant="h1" tone="inverse">
            {texts.profileTitle}
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
          <Stat icon={House} accent="sky" value={jobs.length} label={texts.statJobs} />
          <View style={styles.vr} />
          <Stat icon={CircleCheckBig} accent="mint" value={done} label={texts.statDone} />
          <View style={styles.vr} />
          <Stat icon={Camera} accent="amber" value={photos} label={texts.statPhotosUp} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <IconBubble icon={synced ? CloudCheck : CloudUpload} accent={synced ? 'mint' : 'amber'} size="sm" />
            <AppText variant="title">{texts.sync}</AppText>
          </View>
          {synced ? (
            <AppText variant="body" tone="success">
              {texts.allSynced}
            </AppText>
          ) : (
            <View style={styles.syncList}>
              {queue.length > 0 && (
                <AppText variant="body">
                  {fmt(texts.pendingUploads, { n: queue.length })}
                  {current ? ` · ${fmt(texts.uploading, { pct: Math.round(current.progress * 100) })}` : ''}
                </AppText>
              )}
              {pendingCount > 0 && <AppText variant="body">{fmt(texts.pendingChanges, { n: pendingCount })}</AppText>}
              {failed.slice(0, 3).map((q) => (
                <AppText key={q.id} variant="caption" tone="danger" numberOfLines={1}>
                  {q.label} · {q.lastError}
                </AppText>
              ))}
              {failed.length > 0 && <Button variant="soft" size="sm" label={texts.retryNow} onPress={retryAll} icon={<RefreshCw size={16} color={colors.primaryDark} />} />}
            </View>
          )}
        </View>

        <View style={styles.signOut}>
          <Button variant="outline" label={texts.signOut} onPress={signOut} icon={<LogOut size={18} color={colors.primary} />} />
          <AppText variant="caption" tone="soft" center>
            {texts.appName} · {fmt(texts.version, { v: Constants.expoConfig?.version || '' })}
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}
