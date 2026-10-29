import { StyleSheet } from 'react-native';
import { accents, radius, space } from '../theme/tokens';

export const styles = StyleSheet.create({
    wrap: { gap: space.sm },
    event: { flexDirection: 'row', gap: space.sm },
    rail: { alignItems: 'center' },
    railLine: { flex: 1, width: 2, marginVertical: 2, backgroundColor: accents.amber.soft },
    content: { flex: 1, gap: 2, paddingBottom: space.sm },
    noteBubble: {
        marginTop: space.xs,
        borderRadius: radius.md,
        borderBottomLeftRadius: 4,
        paddingHorizontal: space.md,
        paddingVertical: space.sm,
        backgroundColor: accents.coral.soft,
        alignSelf: 'flex-start',
        maxWidth: '100%',
    },
    currentNote: { borderWidth: 1.5, borderColor: accents.coral.solid },
});
