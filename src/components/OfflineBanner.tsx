import { CloudOff } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { texts } from '../constants/texts';
import { useOnline } from '../context/NetworkContext';
import { accents } from '../theme/tokens';
import { styles } from './OfflineBanner.styles';
import AppText from './ui/AppText';

export default function OfflineBanner() {
  const isOnline = useOnline();
  const insets = useSafeAreaInsets();
  if (isOnline) return null;
  return (
    <View style={[styles.banner, { top: insets.top + 4 }]} accessibilityRole="alert">
      <CloudOff size={15} color={accents.amber.ink} />
      <AppText variant="caption" tone="warning" numberOfLines={1} style={styles.text}>
        {texts.offline}
      </AppText>
    </View>
  );
}
