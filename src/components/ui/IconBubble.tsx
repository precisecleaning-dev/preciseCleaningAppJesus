// src/components/ui/IconBubble.tsx
// Ícono dentro de un círculo con el tinte de su acento (el color = significado).
import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { accents, type AccentName } from '../../theme/tokens';
import { styles } from './IconBubble.styles';

interface Props {
  icon: LucideIcon;
  accent: AccentName;
  size?: 'sm' | 'md' | 'lg';
  solid?: boolean;
}

const ICON = { sm: 16, md: 20, lg: 26 };

export default function IconBubble({ icon: Icon, accent, size = 'md', solid }: Props) {
  const a = accents[accent];
  return (
    <View style={[styles.base, styles[size], { backgroundColor: solid ? a.solid : a.soft }]}>
      <Icon size={ICON[size]} color={solid ? '#FFFFFF' : a.ink} strokeWidth={2.2} />
    </View>
  );
}
