import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Bell, BellRing, CheckCheck, House, MessageSquareText } from 'lucide-react-native';
import { SectionList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenTopBar from '../components/ScreenTopBar';
import AppText from '../components/ui/AppText';
import EmptyState from '../components/ui/EmptyState';
import IconBubble from '../components/ui/IconBubble';
import IconButton from '../components/ui/IconButton';
import Touchable from '../components/ui/Touchable';
import { fmt, texts } from '../constants/texts';
import { useNotifications } from '../context/NotificationsContext';
import { useNow } from '../hooks/useNow';
import type { RootStackParams } from '../navigation/types';
import { styles } from '../styles/NotificationsScreen.styles';
import { gradients, space } from '../theme/tokens';
import { startOfToday } from '../utils/dateFormat';
import type { AppNotification } from '../utils/notificationDiff';
import { notificationView, timeAgo } from '../utils/notificationView';

type Props = NativeStackScreenProps<RootStackParams, 'Notifications'>;

function Row({ n, now, onOpen }: { n: AppNotification; now: number; onOpen: (n: AppNotification) => void }) {
  const v = notificationView(n);
  return (
    <Touchable onPress={() => onOpen(n)} style={[styles.row, !n.read && styles.unread]} accessibilityLabel={`${v.title}. ${v.body}`}>
      <IconBubble icon={v.icon} accent={v.accent} />
      <View style={styles.text}>
        <View style={styles.titleRow}>
          <AppText variant="title" numberOfLines={1} style={styles.title}>
            {v.title}
          </AppText>
          <AppText variant="caption" tone="soft">
            {timeAgo(n.at, now)}
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
  const insets = useSafeAreaInsets();
  const { list, unread, markRead, markAllRead } = useNotifications();

  const now = useNow();
  const today = startOfToday(now);
  const sections = [
    { key: 'today', title: texts.today, data: list.filter((n) => n.at >= today) },
    { key: 'earlier', title: texts.earlier, data: list.filter((n) => n.at < today) },
  ].filter((s) => s.data.length > 0);

  const open = (n: AppNotification) => {
    markRead(n.id);
    if (n.jobId) navigation.navigate('JobDetail', { jobId: n.jobId });
  };

  return (
    <View style={styles.screen}>
      <ScreenTopBar
        title={texts.notifTitle}
        subtitle={unread > 0 ? fmt(texts.unreadCount, { n: unread }) : undefined}
        onBack={() => navigation.goBack()}
        right={unread > 0 ? <IconButton icon={CheckCheck} onPress={markAllRead} label={texts.markAllRead} /> : undefined}
      />
      <SectionList
        sections={sections}
        keyExtractor={(n) => n.id}
        contentContainerStyle={[styles.list, { paddingBottom: space.xxl + insets.bottom }]}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <AppText variant="label" tone="muted" style={styles.section}>
            {section.title}
          </AppText>
        )}
        renderItem={({ item }) => <Row n={item} now={now.getTime()} onOpen={open} />}
        ListEmptyComponent={
          <EmptyState
            icon={Bell}
            gradient={gradients.brand}
            orbits={[
              { icon: House, accent: 'mint' },
              { icon: BellRing, accent: 'amber' },
              { icon: MessageSquareText, accent: 'teal' },
            ]}
            title={texts.noNotifsTitle}
            body={texts.noNotifsBody}
          />
        }
      />
    </View>
  );
}
