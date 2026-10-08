// src/components/OfflineBanner.tsx
// Píldora ámbar flotante bajo la barra de estado cuando no hay internet.
// Se monta una sola vez (RootNavigator) y aparece encima de cualquier pantalla.
import { CloudOff } from 'lucide-react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { useOnline } from '../context/NetworkContext';
import { accents } from '../theme/tokens';
import { styles } from './OfflineBanner.styles';
import AppText from './ui/AppText';

export default function OfflineBanner() {
  const isOnline = useOnline();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  if (isOnline) return null;
  return (
    <Animated.View entering={FadeInUp} exiting={FadeOutUp} style={[styles.banner, { top: insets.top + 4 }]} accessibilityRole="alert">
      <CloudOff size={15} color={accents.amber.ink} />
      <AppText variant="caption" tone="warning" numberOfLines={1} style={styles.text}>
        {t.offline}
      </AppText>
    </Animated.View>
  );
}
