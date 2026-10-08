import { StyleSheet } from 'react-native';
import { colors, space, touchMin } from '../theme/tokens';

export const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.md },
  close: { width: touchMin, height: touchMin, alignItems: 'center', justifyContent: 'center' },
});
