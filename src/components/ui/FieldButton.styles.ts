import { StyleSheet } from 'react-native';
import { colors, radius, space, touchMin } from '../../theme/tokens';

export const styles = StyleSheet.create({
    field: {
        flex: 1,
        minHeight: touchMin + 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
        paddingHorizontal: space.md,
        paddingVertical: space.sm,
        borderRadius: radius.md,
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: colors.field,
    },
    active: { borderColor: colors.primary, backgroundColor: colors.surface },
    invalid: { borderColor: colors.danger },
    text: { flex: 1 },
});
