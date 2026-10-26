import { StatusBar } from 'expo-status-bar';
import { Mail, RefreshCw, ShieldAlert, ShieldOff, UserX, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppText from '../components/ui/AppText';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { t } from '../constants/strings';
import { useSession } from '../context/SessionContext';
import { colors, gradients } from '../theme/tokens';
import { styles } from './BlockedScreen.styles';

type BlockedReason = 'noProfile' | 'profileError' | 'inactive' | 'noRole' | 'roleError';

interface Props {
    reason: BlockedReason;
}

const CONTENT: Record<BlockedReason, { icon: LucideIcon; title: string; body: string }> = {
    noProfile: { icon: UserX, title: t.noProfileTitle, body: t.noProfileBody },
    profileError: { icon: ShieldAlert, title: t.profileErrorTitle, body: t.profileErrorBody },
    inactive: { icon: UserX, title: t.noProfileTitle, body: t.inactiveBody },
    noRole: { icon: ShieldOff, title: t.noRoleTitle, body: t.noRoleBody },
    roleError: { icon: ShieldAlert, title: t.roleErrorTitle, body: t.roleErrorBody },
};

const BlockedScreen = ({ reason }: Props) => {
    const { signOut, authUser, retryProfile, retryPermissions } = useSession();
    const retry = reason === 'profileError' ? retryProfile : reason === 'roleError' ? retryPermissions : null;
    const content = CONTENT[reason];
    return (
        <SafeAreaView style={styles.screen}>
            <StatusBar style="dark" />
            <EmptyState
                icon={content.icon}
                gradient={gradients.amber}
                orbits={[
                    { icon: ShieldAlert, accent: 'coral' },
                    { icon: Mail, accent: 'sky' },
                    { icon: UserX, accent: 'violet' },
                ]}
                title={content.title}
                body={content.body}
            />
            <AppText variant="small" tone="muted" center>
                {authUser?.email}
            </AppText>
            <View style={styles.action}>
                {retry && <Button variant="soft" label={t.tryAgain} onPress={retry} icon={<RefreshCw size={18} color={colors.primaryDark} />} />}
                <Button variant="outline" label={t.signOut} onPress={signOut} />
            </View>
        </SafeAreaView>
    );
};

export default BlockedScreen;
