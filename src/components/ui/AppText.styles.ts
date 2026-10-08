import { StyleSheet } from 'react-native';
import { accents, colors, type } from '../../theme/tokens';

// Variantes tipográficas y tonos en hojas SEPARADAS: comparten nombres
// ("body") y en una sola hoja el tono pisaría a la variante.
export const styles = StyleSheet.create({
  ...type,
  center: { textAlign: 'center' },
});

export const tones = StyleSheet.create({
  default: { color: colors.text },
  body: { color: colors.textBody },
  muted: { color: colors.textMuted },
  soft: { color: colors.textSoft },
  inverse: { color: colors.white },
  inverseMuted: { color: colors.onBrandMuted },
  brand: { color: colors.primary },
  success: { color: accents.mint.ink },
  danger: { color: accents.coral.ink },
  warning: { color: accents.amber.ink },
});
