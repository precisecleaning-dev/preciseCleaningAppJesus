import { StyleSheet } from 'react-native';
import { space } from '../theme/tokens';

export const styles = StyleSheet.create({
    card: { gap: space.md },
    sendArea: { gap: space.sm },
    actions: { gap: space.sm },
    row: { flexDirection: 'row', gap: space.sm },
    flex: { flex: 1 },
    noteInput: { minHeight: 72, maxHeight: 160, textAlignVertical: 'top' },
});
