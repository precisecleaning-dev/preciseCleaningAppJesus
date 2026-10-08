// src/components/NotificationToast.tsx
// ⭐ Aviso flotante: baja desde arriba con resorte cuando llega algo nuevo
//    (casa asignada, cambio de horario, nota…). Se va solo en 4,5 s, se puede
//    deslizar hacia arriba para cerrarlo y al tocarlo abre la casa.
import { X } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { SlideInUp, SlideOutUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationsContext';
import { openJob } from '../navigation/navigationRef';
import { colors } from '../theme/tokens';
import { notificationView } from '../utils/notificationView';
import { styles } from './NotificationToast.styles';
import AppText from './ui/AppText';
import IconBubble from './ui/IconBubble';

const VISIBLE_MS = 4500;

export default function NotificationToast() {
  const { toast, dismissToast, markRead } = useNotifications();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const dragY = useSharedValue(0);

  useEffect(() => {
    if (!toast) return;
    dragY.set(0);
    const timer = setTimeout(dismissToast, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast, dismissToast, dragY]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      dragY.set(Math.min(0, e.translationY));
    })
    .onEnd((e) => {
      if (e.translationY < -30) scheduleOnRN(dismissToast);
      else dragY.set(withSpring(0));
    });
  const drag = useAnimatedStyle(() => ({ transform: [{ translateY: dragY.value }] }));

  if (!toast) return null;
  const v = notificationView(toast, t);

  return (
    <View style={[styles.host, { top: insets.top + 6 }]}>
      <GestureDetector gesture={pan}>
        <Animated.View key={toast.id} entering={SlideInUp.springify().damping(16)} exiting={SlideOutUp.duration(220)} style={[styles.card, drag]}>
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
            <Pressable onPress={dismissToast} hitSlop={12} accessibilityRole="button" accessibilityLabel={t.cancel}>
              <X size={18} color={colors.textSoft} />
            </Pressable>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
