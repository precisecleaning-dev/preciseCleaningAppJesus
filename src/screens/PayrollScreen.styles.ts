import { StyleSheet } from 'react-native';
import { colors, radius, shadow, space, TAB_BAR_SPACE, type } from '../theme/tokens';

export const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    list: { paddingBottom: TAB_BAR_SPACE },
    flex: { flex: 1, minWidth: 0 },
    balanceRow: { gap: space.sm },
    balance: { ...type.number, fontSize: 38, lineHeight: 46, color: colors.white, padding: 0, alignSelf: 'stretch' },
    monthTile: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: colors.glass,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        borderRadius: radius.pill,
        paddingVertical: space.xs,
        paddingHorizontal: space.md,
        gap: space.xs,
    },
    monthValue: { ...type.number, fontSize: 16, lineHeight: 20, color: colors.white, padding: 0, minWidth: 90 },
    chartCard: { marginTop: -48, marginHorizontal: space.md, backgroundColor: colors.surface, borderRadius: radius.xl, padding: space.lg, gap: space.md, ...shadow.raised },
    chartHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm, flexWrap: 'wrap' },
    legend: { flexDirection: 'row', gap: space.xs },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.xs },
    item: { marginHorizontal: space.md, marginBottom: space.sm, backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.md, gap: space.sm, ...shadow.card },
    row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    amountCol: { alignItems: 'flex-end', gap: 4 },
    adjustments: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
    skeletons: { padding: space.md },
});
