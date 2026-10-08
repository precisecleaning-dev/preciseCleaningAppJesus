// src/components/ui/EmptyState.tsx
import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { AccentName } from '../../theme/tokens';
import AppText from './AppText';
import { styles } from './EmptyState.styles';
import FloatingIllustration from './FloatingIllustration';

interface Props {
  icon: LucideIcon;
  title: string;
  body?: string;
  gradient: readonly [string, string];
  orbits: [{ icon: LucideIcon; accent: AccentName }, { icon: LucideIcon; accent: AccentName }, { icon: LucideIcon; accent: AccentName }];
}

export default function EmptyState({ icon, title, body, gradient, orbits }: Props) {
  return (
    <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.wrap}>
      <FloatingIllustration icon={icon} gradient={gradient} orbits={orbits} size={170} />
      <View style={styles.text}>
        <AppText variant="h2" center>
          {title}
        </AppText>
        {!!body && (
          <AppText variant="small" tone="muted" center>
            {body}
          </AppText>
        )}
      </View>
    </Animated.View>
  );
}
