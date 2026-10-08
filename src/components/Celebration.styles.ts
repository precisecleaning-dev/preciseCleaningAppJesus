import { StyleSheet } from 'react-native';
import { accents } from '../theme/tokens';

export const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', zIndex: 50, pointerEvents: 'none' },
  ring: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 6, borderColor: accents.mint.solid },
  piece: { position: 'absolute' },
  round: { width: 10, height: 10, borderRadius: 5 },
  rect: { width: 7, height: 14, borderRadius: 2 },
});
