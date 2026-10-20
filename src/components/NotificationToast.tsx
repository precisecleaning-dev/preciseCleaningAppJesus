import { X } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../context/NotificationsContext';
import { openJob } from '../navigation/navigationRef';
import { colors } from '../theme/tokens';
import { notificationView } from '../utils/notificationView';
import { styles } from './NotificationToast.styles';
import AppText from './ui/AppText';
import IconBubble from './ui/IconBubble';
import { t } from '../constants/strings';

const VISIBLE_MS = 6000;

export default function NotificationToast() {
    const { toast, dismissToast, markRead } = useNotifications();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(dismissToast, VISIBLE_MS);
        return () => clearTimeout(timer);
    }, [toast, dismissToast]);

    if (!toast) return null;
    const v = notificationView(toast);

    return (
        <View style={[styles.host, { top: insets.top + 6 }]}>
            <View style={styles.card}>
                <Pressable
                    style={styles.row}
                    accessibilityRole="button"
                    accessibilityLabel={`${v.title}. ${v.body}`}
                    onPress={() => {
                        markRead(toast.id);
                        dismissToast();
                        if (toast.jobId) openJob(toast.jobId);
                    }}
                >
                    <IconBubble icon={v.icon} accent={v.accent} solid />
                    <View style={styles.text}>
                        <AppText variant="title" numberOfLines={1}>
                            {v.title}
                        </AppText>
                        <AppText variant="small" tone="muted" numberOfLines={2}>
                            {v.body}
                        </AppText>
                    </View>
                    <Pressable onPress={dismissToast} hitSlop={12} accessibilityRole="button" accessibilityLabel={t.close}>
                        <X size={18} color={colors.textSoft} />
                    </Pressable>
                </Pressable>
            </View>
        </View>
    );
}
