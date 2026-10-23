import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { colors } from '../../theme/tokens';
import AppText from './AppText';
import { styles } from './FieldButton.styles';
import Touchable from './Touchable';

interface Props {
    icon: LucideIcon;
    value: string;
    placeholder: string;
    onPress: () => void;
    accessibilityLabel: string;
    isActive?: boolean;
    isInvalid?: boolean;
    hasChevron?: boolean;
    numberOfLines?: number;
}

const FieldButton = ({ icon: Icon, value, placeholder, onPress, accessibilityLabel, isActive = false, isInvalid = false, hasChevron = false, numberOfLines = 1 }: Props) => (
    <Touchable onPress={onPress} style={[styles.field, isActive && styles.active, isInvalid && styles.invalid]} accessibilityLabel={accessibilityLabel}>
        <Icon size={18} color={value ? colors.primary : colors.textSoft} />
        <AppText variant="body" tone={value ? 'default' : 'muted'} numberOfLines={numberOfLines} style={styles.text}>
            {value || placeholder}
        </AppText>
        {hasChevron && <ChevronRight size={18} color={colors.textSoft} />}
    </Touchable>
);

export default FieldButton;
