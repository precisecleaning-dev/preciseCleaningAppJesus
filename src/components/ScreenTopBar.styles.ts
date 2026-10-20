import { StyleSheet } from 'react-native';
import { space } from '../theme/tokens';

export const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    titles: { flex: 1, minWidth: 0 },
});
