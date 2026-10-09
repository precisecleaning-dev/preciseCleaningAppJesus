import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import AppText from './AppText';
import { styles } from './EmptyState.styles';
import Illustration, { type Orbits } from './Illustration';

interface Props {
  icon: LucideIcon;
  title: string;
  body?: string;
  gradient: readonly [string, string];
  orbits: Orbits;
}

export default function EmptyState({ icon, title, body, gradient, orbits }: Props) {
  return (
    <View style={styles.wrap}>
      <Illustration icon={icon} gradient={gradient} orbits={orbits} size={170} />
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
    </View>
  );
}
