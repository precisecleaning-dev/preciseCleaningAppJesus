import { Camera, CircleCheckBig, CirclePlay, House, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { solidBg } from '../theme/accentStyles';
import { colors, type AccentName } from '../theme/tokens';
import { styles } from './WorkProgress.styles';
import AppText from './ui/AppText';
import { t } from '../constants/strings';

interface Props {
  started: boolean;
  photosOk: boolean;
  finished: boolean;
}

export default function WorkProgress({ started, photosOk, finished }: Props) {
  const steps: { icon: LucideIcon; label: string; done: boolean; accent: AccentName }[] = [
    { icon: House, label: t.stepAssigned, done: true, accent: 'sky' },
    { icon: CirclePlay, label: t.stepStarted, done: started || finished, accent: 'violet' },
    { icon: Camera, label: t.stepPhotos, done: photosOk, accent: 'amber' },
    { icon: CircleCheckBig, label: t.stepFinished, done: finished, accent: 'mint' },
  ];
  const lastDone = steps.reduce((acc, s, i) => (s.done ? i : acc), 0);

  return (
    <View style={styles.wrap} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: steps.length - 1, now: lastDone }}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${(lastDone / (steps.length - 1)) * 100}%` }]} />
      </View>
      <View style={styles.row}>
        {steps.map(({ icon: Icon, label, done, accent }) => (
          <View key={label} style={styles.step}>
            <View style={[styles.node, done ? solidBg[accent] : styles.nodeIdle]}>
              <Icon size={16} color={done ? colors.white : colors.textSoft} strokeWidth={2.4} />
            </View>
            <AppText variant="caption" tone={done ? 'default' : 'soft'} numberOfLines={1}>
              {label}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}
