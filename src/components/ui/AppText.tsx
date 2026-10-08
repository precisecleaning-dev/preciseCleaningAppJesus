// src/components/ui/AppText.tsx
// ⭐ Única puerta a la tipografía: toda la app escribe con <AppText variant>.
//    Así la fuente (Plus Jakarta Sans), los tamaños y el color base no se
//    repiten pantalla por pantalla y cambiar la escala es tocar un solo archivo.
import { Text, type TextProps } from 'react-native';
import type { TypeVariant } from '../../theme/tokens';
import { styles, tones } from './AppText.styles';

type Tone = 'default' | 'body' | 'muted' | 'soft' | 'inverse' | 'inverseMuted' | 'brand' | 'success' | 'danger' | 'warning';

interface Props extends TextProps {
  variant?: TypeVariant;
  tone?: Tone;
  center?: boolean;
}

export default function AppText({ variant = 'body', tone = 'default', center, style, ...rest }: Props) {
  return <Text {...rest} style={[styles[variant], tones[tone], center && styles.center, style]} />;
}
