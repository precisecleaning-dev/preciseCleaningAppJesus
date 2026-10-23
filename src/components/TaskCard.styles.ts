import { StyleSheet } from 'react-native';
import { space, touchMin } from '../theme/tokens';

export const styles = StyleSheet.create({
    top: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    titles: { flex: 1, gap: 2, minWidth: 0 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
    footer: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
    counter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    completeButton: { width: touchMin, height: touchMin, alignItems: 'center', justifyContent: 'center', marginRight: -space.xs },
});
