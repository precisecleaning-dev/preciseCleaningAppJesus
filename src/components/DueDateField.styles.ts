import { StyleSheet } from 'react-native';
import { space, touchMin } from '../theme/tokens';

export const styles = StyleSheet.create({
    wrap: { gap: space.sm },
    row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    clearButton: { width: touchMin, height: touchMin, alignItems: 'center', justifyContent: 'center' },
});
