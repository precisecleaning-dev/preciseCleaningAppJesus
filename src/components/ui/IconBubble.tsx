import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { softBg, solidBg } from '../../theme/accentStyles';
import { accents, colors, type AccentName } from '../../theme/tokens';
import { styles } from './IconBubble.styles';

interface Props {
    icon: LucideIcon;
    accent: AccentName;
    size?: 'sm' | 'md' | 'lg';
    solid?: boolean;
}

const ICON = { sm: 16, md: 20, lg: 26 };

export default function IconBubble({ icon: Icon, accent, size = 'md', solid }: Props) {
    return (
        <View style={[styles.base, styles[size], solid ? solidBg[accent] : softBg[accent]]}>
            <Icon size={ICON[size]} color={solid ? colors.white : accents[accent].ink} strokeWidth={2.2} />
        </View>
    );
}
