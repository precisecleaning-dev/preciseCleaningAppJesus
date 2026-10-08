// src/screens/BlockedScreen.tsx
// Sesión válida en Firebase Auth pero sin perfil activo en System Users.
import { Mail, ShieldAlert, UserX } from 'lucide-react-native';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppText from '../components/ui/AppText';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { useLanguage } from '../context/LanguageContext';
import { useSession } from '../context/SessionContext';
import { gradients } from '../theme/tokens';
import { styles } from './BlockedScreen.styles';

export default function BlockedScreen({ reason }: { reason: 'noProfile' | 'inactive' }) {
  const { t } = useLanguage();
  const { signOut, authUser } = useSession();
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <EmptyState
        icon={UserX}
        gradient={gradients.amber}
        orbits={[{ icon: ShieldAlert, accent: 'coral' }, { icon: Mail, accent: 'sky' }, { icon: UserX, accent: 'violet' }]}
        title={t.noProfileTitle}
        body={reason === 'inactive' ? t.inactiveBody : t.noProfileBody}
      />
      <AppText variant="small" tone="muted" center>
        {authUser?.email}
      </AppText>
      <View style={styles.action}>
        <Button variant="outline" label={t.signOut} onPress={signOut} />
      </View>
    </SafeAreaView>
  );
}
