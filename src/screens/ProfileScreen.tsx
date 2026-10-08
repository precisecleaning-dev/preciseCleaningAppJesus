// src/screens/ProfileScreen.tsx
import Constants from 'expo-constants';
import { CloudUpload, LogOut } from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';
import ActionButton from '../components/ActionButton';
import Segmented from '../components/Segmented';
import { ui } from '../components/ui.styles';
import { useCatalogs } from '../context/CatalogsContext';
import { useLanguage } from '../context/LanguageContext';
import { useOutbox } from '../context/OutboxContext';
import { usePhotoQueue } from '../context/PhotoQueueContext';
import { useCurrentUser, useSession } from '../context/SessionContext';
import { colors } from '../theme/tokens';
import type { Lang } from '../i18n/strings';
import { findRelation } from '../utils/relations';
import { styles } from './ProfileScreen.styles';

export default function ProfileScreen() {
  const { t, lang, setLang } = useLanguage();
  const user = useCurrentUser();
  const { role, signOut } = useSession();
  const { teams } = useCatalogs();
  const { queue, retryAll, current } = usePhotoQueue();
  const { pendingCount } = useOutbox();
  const team = findRelation(teams, user.teamId);
  const failed = queue.filter((q) => q.blocked || q.attempts > 0);

  return (
    <ScrollView style={ui.screen} contentContainerStyle={styles.content}>
      <View style={[ui.card, styles.center]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user.firstName?.[0] || '').toUpperCase()}
            {(user.lastName?.[0] || '').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>
          {user.firstName} {user.lastName}
        </Text>
        <Text style={ui.muted}>{user.email}</Text>
        <Text style={ui.muted}>{[role?.name, team?.name].filter(Boolean).join(' · ')}</Text>
      </View>

      <View style={[ui.card, styles.gap]}>
        <Text style={ui.sectionTitle}>{t.language}</Text>
        <Segmented<Lang>
          value={lang}
          onChange={setLang}
          options={[
            { value: 'es', label: 'Español' },
            { value: 'en', label: 'English' },
          ]}
        />
      </View>

      <View style={[ui.card, styles.gap]}>
        <View style={ui.row}>
          <CloudUpload size={20} color={queue.length ? colors.warning : colors.success} />
          <Text style={styles.queueText}>
            {t.pendingUploads}: {queue.length}
            {current ? ` · ${t.uploading} ${Math.round(current.progress * 100)}%` : ''}
          </Text>
        </View>
        {pendingCount > 0 && (
          <Text style={ui.muted}>
            {t.pendingChanges}: {pendingCount}
          </Text>
        )}
        {failed.length > 0 && (
          <>
            {failed.slice(0, 3).map((q) => (
              <Text key={q.id} style={styles.error} numberOfLines={1}>
                {q.label} · {q.lastError}
              </Text>
            ))}
            <ActionButton variant="outline" compact label={t.retryNow} onPress={retryAll} />
          </>
        )}
      </View>

      <ActionButton variant="danger" label={t.signOut} icon={<LogOut size={18} color={colors.white} />} onPress={signOut} />
      <Text style={styles.version}>
        {t.version} {Constants.expoConfig?.version}
      </Text>
    </ScrollView>
  );
}
