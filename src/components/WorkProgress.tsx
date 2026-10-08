// src/components/WorkProgress.tsx
// ⭐ Avance del trabajo en 4 pasos: Asignada → Iniciada → Fotos → Terminada.
//    La línea se rellena con resorte y cada paso cumplido toma su color.
import { Camera, CircleCheckBig, CirclePlay, House, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useLanguage } from '../context/LanguageContext';
import { accents, colors, motion, type AccentName } from '../theme/tokens';
import { styles } from './WorkProgress.styles';
import AppText from './ui/AppText';

interface Props {
  started: boolean;
  photosOk: boolean;
  finished: boolean;
}

export default function WorkProgress({ started, photosOk, finished }: Props) {
  const { t } = useLanguage();
  const [w, setW] = useState(0);
  const steps: { icon: LucideIcon; label: string; done: boolean; accent: AccentName }[] = [
    { icon: House, label: t.stepAssigned, done: true, accent: 'sky' },
    { icon: CirclePlay, label: t.stepStarted, done: started || finished, accent: 'violet' },
    { icon: Camera, label: t.stepPhotos, done: photosOk, accent: 'amber' },
    { icon: CircleCheckBig, label: t.stepFinished, done: finished, accent: 'mint' },
  ];
  const lastDone = steps.reduce((acc, s, i) => (s.done ? i : acc), 0);
  const target = (w * lastDone) / (steps.length - 1);
  const fill = useAnimatedStyle(() => ({ width: withSpring(target, motion.springSoft) }));

  return (
    <View style={styles.wrap} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 3, now: lastDone }}>
      <View style={styles.track} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        <Animated.View style={[styles.fill, fill]} />
      </View>
      <View style={styles.row}>
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <View key={s.label} style={styles.step}>
              <View style={[styles.node, s.done ? { backgroundColor: accents[s.accent].solid } : styles.nodeIdle]}>
                <Icon size={16} color={s.done ? colors.white : colors.textSoft} strokeWidth={2.4} />
              </View>
              <AppText variant="caption" tone={s.done ? 'default' : 'soft'} numberOfLines={1}>
                {s.label}
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
}
