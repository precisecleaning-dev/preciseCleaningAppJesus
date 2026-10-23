import { StyleSheet } from 'react-native';
import { space } from '../theme/tokens';

export const styles = StyleSheet.create({
    flex: { flex: 1 },
    content: { padding: space.md, gap: space.md, paddingBottom: space.xxl * 3 },
    fieldRow: { flexDirection: 'row' },
    choices: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
});
