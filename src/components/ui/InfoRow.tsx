import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import type { AccentName } from '../../theme/tokens';
import AppText from './AppText';
import IconBubble from './IconBubble';
import { styles } from './InfoRow.styles';

interface Props {
    icon: LucideIcon;
    accent: AccentName;
    label: string;
    value: string;
}

const InfoRow = ({ icon, accent, label, value }: Props) => (
    <View style={styles.row}>
        <IconBubble icon={icon} accent={accent} size="sm" />
        <View style={styles.text}>
            <AppText variant="caption" tone="muted">
                {label}
            </AppText>
            <AppText variant="body">{value}</AppText>
        </View>
    </View>
);

export default InfoRow;
