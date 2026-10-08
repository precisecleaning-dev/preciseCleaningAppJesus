// src/components/OfflineBanner.tsx
import { CloudOff } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useOnline } from '../context/NetworkContext';
import { colors } from '../theme/tokens';
import { styles } from './OfflineBanner.styles';

export default function OfflineBanner() {
  const isOnline = useOnline();
  const { t } = useLanguage();
  if (isOnline) return null;
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <CloudOff size={16} color={colors.warning} />
      <Text style={styles.text}>{t.offline}</Text>
    </View>
  );
}
