import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { inkText, softBg, solidBg } from '../../theme/accentStyles';
import { accents, colors, type AccentName } from '../../theme/tokens';
import { safeColor, withAlpha } from '../../utils/color';
import AppText from './AppText';
import { styles } from './Chip.styles';

interface Props {
  label: string;
  accent?: AccentName;
  color?: string;
  icon?: LucideIcon;
  solid?: boolean;
  onDark?: boolean;
}

export default function Chip({ label, accent = 'brand', color, icon: Icon, solid, onDark }: Props) {
  if (color) {
    return (
      <View style={[styles.chip, onDark ? styles.glass : { backgroundColor: withAlpha(color, 0.14) || colors.idle }]}>
        <View style={[styles.dot, { backgroundColor: safeColor(color, accents[accent].solid) }, onDark && styles.dotRing]} />
        <AppText variant="caption" numberOfLines={1} style={[styles.text, onDark ? styles.textOnDark : styles.textDefault]}>
          {label}
        </AppText>
      </View>
    );
  }
  return (
    <View style={[styles.chip, solid ? solidBg[accent] : softBg[accent]]}>
      {Icon && <Icon size={13} color={solid ? colors.white : accents[accent].ink} strokeWidth={2.4} />}
      <AppText variant="caption" numberOfLines={1} style={[styles.text, solid ? styles.textOnDark : inkText[accent]]}>
        {label}
      </AppText>
    </View>
  );
}
