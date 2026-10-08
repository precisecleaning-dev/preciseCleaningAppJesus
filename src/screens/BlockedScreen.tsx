// src/screens/BlockedScreen.tsx
// Sesión válida en Firebase Auth pero sin perfil activo en System Users.
import { UserX } from 'lucide-react-native';
import { Text, View } from 'react-native';
import ActionButton from '../components/ActionButton';
import { ui } from '../components/ui.styles';
import { useLanguage } from '../context/LanguageContext';
import { useSession } from '../context/SessionContext';
import { colors } from '../theme/tokens';
import { styles } from './BlockedScreen.styles';

export default function BlockedScreen({ reason }: { reason: 'noProfile' | 'inactive' }) {
  const { t } = useLanguage();
  const { signOut, authUser } = useSession();
  return (
    <View style={ui.center}>
      <UserX size={48} color={colors.textMuted} />
      <Text style={styles.title}>{t.noProfileTitle}</Text>
      <Text style={styles.body}>{reason === 'inactive' ? t.inactiveBody : t.noProfileBody}</Text>
      <Text style={ui.muted}>{authUser?.email}</Text>
      <View style={styles.action}>
        <ActionButton variant="outline" label={t.signOut} onPress={signOut} />
      </View>
    </View>
  );
}
