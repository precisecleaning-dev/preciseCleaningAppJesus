import { StyleSheet } from 'react-native';
import { space } from '../../theme/tokens';

export const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    text: { flex: 1, minWidth: 0, gap: 2 },
});
