import type { LucideIcon } from 'lucide-react-native';
import { colors } from '../../theme/tokens';
import AppText from './AppText';
import { styles } from './GlassPillButton.styles';
import Touchable from './Touchable';

interface Props {
    label: string;
    onPress: () => void;
    icon?: LucideIcon;
    trailingIcon?: LucideIcon;
    size?: 'sm' | 'md';
    accessibilityRole?: 'button' | 'link';
}

const GlassPillButton = ({ label, onPress, icon: Icon, trailingIcon: TrailingIcon, size = 'md', accessibilityRole = 'button' }: Props) => (
    <Touchable onPress={onPress} style={[styles.pill, styles[size]]} accessibilityRole={accessibilityRole} accessibilityLabel={label}>
        {Icon && <Icon size={size === 'sm' ? 15 : 18} color={colors.white} />}
        <AppText variant={size === 'sm' ? 'caption' : 'title'} tone="inverse" numberOfLines={1} style={styles.label}>
            {label}
        </AppText>
        {TrailingIcon && <TrailingIcon size={size === 'sm' ? 15 : 18} color={colors.white} />}
    </Touchable>
);

export default GlassPillButton;
