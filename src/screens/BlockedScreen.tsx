import { StatusBar } from 'expo-status-bar';
import { Mail, ShieldAlert, UserX } from 'lucide-react-native';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppText from '../components/ui/AppText';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { texts } from '../constants/texts';
import { useSession } from '../context/SessionContext';
import { styles } from '../styles/BlockedScreen.styles';
import { gradients } from '../theme/tokens';

export default function BlockedScreen({ reason }: { reason: 'noProfile' | 'inactive' }) {
  const { signOut, authUser } = useSession();
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <EmptyState
        icon={UserX}
        gradient={gradients.amber}
        orbits={[
          { icon: ShieldAlert, accent: 'coral' },
          { icon: Mail, accent: 'sky' },
          { icon: UserX, accent: 'violet' },
        ]}
        title={texts.noProfileTitle}
        body={reason === 'inactive' ? texts.inactiveBody : texts.noProfileBody}
      />
      <AppText variant="small" tone="muted" center>
        {authUser?.email}
      </AppText>
      <View style={styles.action}>
        <Button variant="outline" label={texts.signOut} onPress={signOut} />
      </View>
    </SafeAreaView>
  );
}
