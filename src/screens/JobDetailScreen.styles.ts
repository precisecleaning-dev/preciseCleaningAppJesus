import { StyleSheet } from 'react-native';
import { accents, colors, radius, space } from '../theme/tokens';

export const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    flex: { flex: 1 },
    content: { paddingHorizontal: space.md, gap: space.md },
    headChips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, alignItems: 'center' },
    mapsSlot: { marginLeft: 'auto' },
    progressCard: { marginTop: -50, gap: space.md },
    logs: { gap: 2, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: space.sm },
    gapLg: { gap: space.md },
    cardTitle: { marginBottom: space.sm },
    lock: { flexDirection: 'row', alignItems: 'center', gap: space.xs, backgroundColor: accents.amber.soft, borderRadius: radius.md, padding: space.sm },
    divider: { height: 1, backgroundColor: colors.border },
    tiles: { flexDirection: 'row', flexWrap: 'wrap', rowGap: space.md, columnGap: space.sm },
    tile: { width: '48%', flexDirection: 'row', alignItems: 'center', gap: space.sm },
    doneBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        backgroundColor: accents.mint.soft,
        borderRadius: radius.xl,
        padding: space.md,
        borderWidth: 1,
        borderColor: accents.mint.solid,
    },
});
