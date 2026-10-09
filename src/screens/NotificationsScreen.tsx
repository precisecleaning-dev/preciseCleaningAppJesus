import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Bell, BellRing, CheckCheck, House, MessageSquareText } from 'lucide-react-native';
import { SectionList, View } from 'react-native';
import ScreenTopBar from '../components/ScreenTopBar';
import AppText from '../components/ui/AppText';
import EmptyState from '../components/ui/EmptyState';
import IconBubble from '../components/ui/IconBubble';
import IconButton from '../components/ui/IconButton';
import Touchable from '../components/ui/Touchable';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationsContext';
import type { AppNotification } from '../utils/notificationDiff';
import { fmt } from '../i18n/strings';
import type { RootStackParams } from '../navigation/types';
import { gradients } from '../theme/tokens';
import { startOfToday } from '../utils/dateFormat';
import { notificationView, timeAgo } from '../utils/notificationView';
import { styles } from './NotificationsScreen.styles';

type Props = NativeStackScreenProps<RootStackParams, 'Notifications'>;

function Row({ n, onOpen }: { n: AppNotification; onOpen: (n: AppNotification) => void }) {
  const { t } = useLanguage();
  const v = notificationView(n, t);
  return (
    <Touchable onPress={() => onOpen(n)} style={[styles.row, !n.read && styles.unread]} accessibilityLabel={`${v.title}. ${v.body}`}>
      <IconBubble icon={v.icon} accent={v.accent} />
      <View style={styles.text}>
        <View style={styles.titleRow}>
          <AppText variant="title" numberOfLines={1} style={styles.title}>
            {v.title}
          </AppText>
          <AppText variant="caption" tone="soft">
            {timeAgo(n.at, t)}
          </AppText>
        </View>
        <AppText variant="small" tone="body" numberOfLines={3}>
          {v.body}
        </AppText>
      </View>
      {!n.read && <View style={styles.dot} />}
    </Touchable>
  );
}

export default function NotificationsScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const { list, unread, markRead, markAllRead } = useNotifications();

  const today = startOfToday();
  const sections = [
    { key: 'today', title: t.today, data: list.filter((n) => n.at >= today) },
    { key: 'earlier', title: t.earlier, data: list.filter((n) => n.at < today) },
  ].filter((s) => s.data.length > 0);

  const open = (n: AppNotification) => {
    markRead(n.id);
    if (n.jobId) navigation.navigate('JobDetail', { jobId: n.jobId });
  };

  return (
    <View style={styles.screen}>
      <ScreenTopBar
        title={t.notifTitle}
        subtitle={unread > 0 ? fmt(t.unreadCount, { n: unread }) : undefined}
        onBack={() => navigation.goBack()}
        right={unread > 0 ? <IconButton icon={CheckCheck} onPress={markAllRead} label={t.markAllRead} /> : undefined}
      />
      <SectionList
        sections={sections}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <AppText variant="label" tone="muted" style={styles.section}>
            {section.title}
          </AppText>
        )}
        renderItem={({ item }) => <Row n={item} onOpen={open} />}
        ListEmptyComponent={
          <EmptyState
            icon={Bell}
            gradient={gradients.brand}
            orbits={[
              { icon: House, accent: 'mint' },
              { icon: BellRing, accent: 'amber' },
              { icon: MessageSquareText, accent: 'teal' },
            ]}
            title={t.noNotifsTitle}
            body={t.noNotifsBody}
          />
        }
      />
    </View>
  );
}
