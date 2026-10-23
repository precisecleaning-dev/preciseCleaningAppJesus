import { StyleSheet } from 'react-native';
import { accents, colors, space } from '../theme/tokens';

export const styles = StyleSheet.create({
    top: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    titles: { flex: 1, gap: 2, minWidth: 0 },
    line: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    flex: { flex: 1 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
    footer: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, alignItems: 'center' },
    photos: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
    photosText: { color: colors.textMuted },
    photosPending: { color: accents.amber.ink },
});
