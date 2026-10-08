import { StyleSheet } from 'react-native';
import { colors } from '../theme/tokens';

export const styles = StyleSheet.create({
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: colors.primary, zIndex: 80, pointerEvents: 'none' },
});
