import { StyleSheet } from 'react-native';
import { space } from '../theme/tokens';

export const styles = StyleSheet.create({
    top: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    titles: { flex: 1, gap: 2, minWidth: 0 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
    openTime: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
