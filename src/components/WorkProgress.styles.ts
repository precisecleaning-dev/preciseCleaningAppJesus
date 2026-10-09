import { StyleSheet } from 'react-native';
import { accents, colors, space } from '../theme/tokens';

const NODE = 34;

export const styles = StyleSheet.create({
  wrap: { paddingTop: 2 },
  track: { position: 'absolute', top: NODE / 2 + 1, left: '12.5%', right: '12.5%', height: 4, borderRadius: 2, backgroundColor: colors.border },
  fill: { height: 4, borderRadius: 2, backgroundColor: accents.violet.solid },
  row: { flexDirection: 'row' },
  step: { flex: 1, alignItems: 'center', gap: space.xxs },
  node: { width: NODE, height: NODE, borderRadius: NODE / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.surface },
  nodeIdle: { backgroundColor: colors.idle },
});
