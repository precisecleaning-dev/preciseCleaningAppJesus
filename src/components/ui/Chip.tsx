// src/components/ui/Chip.tsx
// Etiqueta de estado. Dos modos:
//  · accent: uno de los acentos semánticos de la app (en curso, terminada…).
//  · color: color que viene de Firestore (status/equipo configurado por la oficina).
// `onDark` la adapta a los encabezados con degradado (vidrio + texto blanco).
import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
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
  const a = accents[accent];
  let bg: string;
  let fg: string;
  if (color) {
    bg = onDark ? colors.glass : withAlpha(color, 0.14) || '#EEF2F8';
    fg = onDark ? colors.white : colors.text;
  } else {
    bg = solid ? a.solid : a.soft;
    fg = solid ? colors.white : a.ink;
  }
  return (
    <View style={[styles.chip, onDark && styles.glass, { backgroundColor: bg }]}>
      {color ? <View style={[styles.dot, { backgroundColor: safeColor(color, a.solid) }, onDark && styles.dotRing]} /> : Icon ? <Icon size={13} color={fg} strokeWidth={2.4} /> : null}
      <AppText variant="caption" numberOfLines={1} style={[styles.text, { color: fg }]}>
        {label}
      </AppText>
    </View>
  );
}
