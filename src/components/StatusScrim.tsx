// src/components/StatusScrim.tsx
// Franja con el color de la marca detrás de la barra de estado. Cuando el
// encabezado con degradado se va con el scroll, los íconos blancos de la barra
// siguen leyéndose sobre azul y las tarjetas no pasan por debajo de la hora.
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './StatusScrim.styles';

export default function StatusScrim() {
  const insets = useSafeAreaInsets();
  return <View style={[styles.scrim, { height: insets.top }]} />;
}
