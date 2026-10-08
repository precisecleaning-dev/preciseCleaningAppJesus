import { StyleSheet } from 'react-native';
import { colors, space } from '../theme/tokens';

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: space.xs },
  col: { flex: 1, alignItems: 'center', gap: 4 },
  value: { fontSize: 10 },
  slot: { height: 110, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  stack: { width: '62%', maxWidth: 30, justifyContent: 'flex-end', transformOrigin: 'bottom' },
  seg: { width: '100%' },
  top: { borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  zero: { height: 4, borderRadius: 2, backgroundColor: colors.border },
});
