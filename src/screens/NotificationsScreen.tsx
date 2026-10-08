// src/screens/NotificationsScreen.tsx
// ⭐ Campana: todo lo que cambió para el empleado, agrupado en Hoy / Anteriores.
//    Cada aviso tiene el color de su tipo; los no leídos llevan fondo tintado y
//    punto. Al tocar uno se marca como leído y se abre la casa.
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Bell, BellRing, CheckCheck, House, MessageSquareText } from 'lucide-react-native';
import { memo, useCallback, useMemo } from 'react';
import { SectionList, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import ScreenTopBar from '../components/ScreenTopBar';
import AppText from '../components/ui/AppText';
import EmptyState from '../components/ui/EmptyState';
import IconBubble from '../components/ui/IconBubble';
import IconButton from '../components/ui/IconButton';
import PressableScale from '../components/ui/PressableScale';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications, type AppNotification } from '../context/NotificationsContext';
import { fmt } from '../i18n/strings';
import type { RootStackParams } from '../navigation/types';
import { gradients, motion } from '../theme/tokens';
import { startOfToday } from '../utils/dateFormat';
import { notificationView, timeAgo } from '../utils/notificationView';
import { styles } from './NotificationsScreen.styles';

type Props = NativeStackScreenProps<RootStackParams, 'Notifications'>;

const Row = memo(function Row({ n, index, onOpen }: { n: AppNotification; index: number; onOpen: (n: AppNotification) => void }) {
  const { t } = useLanguage();
  const v = notificationView(n, t);
  return (
    <Animated.View entering={FadeInRight.delay(Math.min(index, 8) * motion.stagger).springify().damping(18)}>
      <PressableScale onPress={() => onOpen(n)} style={[styles.row, !n.read && styles.unread]} accessibilityLabel={`${v.title}. ${v.body}`}>
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
      </PressableScale>
    </Animated.View>
  );
});

export default function NotificationsScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const { list, unread, markRead, markAllRead } = useNotifications();

  const sections = useMemo(() => {
    const today = startOfToday();
    const todayItems = list.filter((n) => n.at >= today);
    const earlier = list.filter((n) => n.at < today);
    return [
      { key: 'today', title: t.today, data: todayItems },
      { key: 'earlier', title: t.earlier, data: earlier },
    ].filter((s) => s.data.length > 0);
  }, [list, t]);

  const open = useCallback(
    (n: AppNotification) => {
      markRead(n.id);
      if (n.jobId) navigation.navigate('JobDetail', { jobId: n.jobId });
    },
    [markRead, navigation],
  );

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
        renderItem={({ item, index }) => <Row n={item} index={index} onOpen={open} />}
        ListEmptyComponent={
          <EmptyState
            icon={Bell}
            gradient={gradients.brand}
            orbits={[{ icon: House, accent: 'mint' }, { icon: BellRing, accent: 'amber' }, { icon: MessageSquareText, accent: 'teal' }]}
            title={t.noNotifsTitle}
            body={t.noNotifsBody}
          />
        }
      />
    </View>
  );
}
