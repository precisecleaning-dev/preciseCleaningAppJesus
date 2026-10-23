import { StyleSheet } from 'react-native';
import { accents, colors, radius, space, touchMin } from '../theme/tokens';

export const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, paddingVertical: space.sm },
    title: { flex: 1 },
    closeButton: { width: touchMin, height: touchMin, alignItems: 'center', justifyContent: 'center' },
    search: { paddingHorizontal: space.md, paddingBottom: space.sm },
    list: { paddingHorizontal: space.md, paddingBottom: space.lg, gap: space.xs },
    empty: { paddingTop: space.xl },
    option: {
        minHeight: touchMin + 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
        paddingHorizontal: space.md,
        borderRadius: radius.md,
        backgroundColor: colors.surface,
    },
    optionSelected: { backgroundColor: accents.brand.soft },
    optionText: { flex: 1, minWidth: 0, gap: 2 },
    footer: { padding: space.md },
});
