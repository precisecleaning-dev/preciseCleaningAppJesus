import { X } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../context/NotificationsContext';
import { openJob } from '../navigation/navigationRef';
import { colors } from '../theme/tokens';
import { notificationView } from '../utils/notificationView';
import { styles } from './NotificationToast.styles';
import AppText from './ui/AppText';
import IconBubble from './ui/IconBubble';
import Touchable from './ui/Touchable';
import { t } from '../constants/strings';

const VISIBLE_MS = 6000;

const NotificationToast = () => {
    const { toast, dismissToast, markRead } = useNotifications();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(dismissToast, VISIBLE_MS);
        return () => clearTimeout(timer);
    }, [toast, dismissToast]);

    if (!toast) return null;
    const visual = notificationView(toast);

    return (
        <View style={[styles.host, { top: insets.top + 6 }]}>
            <View style={styles.card}>
                <Touchable
                    style={styles.row}
                    accessibilityLabel={`${visual.title}. ${visual.body}`}
                    onPress={() => {
                        markRead(toast.id);
                        dismissToast();
                        if (toast.jobId) openJob(toast.jobId);
                    }}
                >
                    <IconBubble icon={visual.icon} accent={visual.accent} solid />
                    <View style={styles.text}>
                        <AppText variant="title" numberOfLines={1}>
                            {visual.title}
                        </AppText>
                        <AppText variant="small" tone="muted" numberOfLines={2}>
                            {visual.body}
                        </AppText>
                    </View>
                    <Touchable onPress={dismissToast} hitSlop={12} accessibilityLabel={t.close}>
                        <X size={18} color={colors.textSoft} />
                    </Touchable>
                </Touchable>
            </View>
        </View>
    );
};

export default NotificationToast;
