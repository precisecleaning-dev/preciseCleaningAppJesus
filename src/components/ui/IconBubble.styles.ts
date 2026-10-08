import { StyleSheet } from 'react-native';
import { radius } from '../../theme/tokens';

export const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  sm: { width: 32, height: 32, borderRadius: radius.sm },
  md: { width: 42, height: 42 },
  lg: { width: 56, height: 56, borderRadius: radius.lg },
});
