// src/components/ui/GradientHeader.tsx
// ⭐ Encabezado de pantalla con el degradado de la marca y borde inferior curvo
//    (la firma visual de la app). Respeta el área segura (notch / isla).
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gradients } from '../../theme/tokens';
import { styles } from './GradientHeader.styles';

interface Props {
  children: ReactNode;
  /** Espacio extra abajo para que una tarjeta se monte sobre el borde. */
  overlap?: number;
}

export default function GradientHeader({ children, overlap = 0 }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={gradients.brand}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + 10, paddingBottom: 22 + overlap }]}
    >
      {/* Círculos de luz decorativos, como reflejo sobre una superficie limpia */}
      <View style={[styles.orb, styles.orbA]} />
      <View style={[styles.orb, styles.orbB]} />
      {children}
    </LinearGradient>
  );
}
