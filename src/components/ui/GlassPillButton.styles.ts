import { StyleSheet } from 'react-native';
import { colors, radius, space } from '../../theme/tokens';

export const styles = StyleSheet.create({
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.glass,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        borderRadius: radius.pill,
        maxWidth: '100%',
    },
    sm: { gap: 6, paddingHorizontal: space.sm, paddingVertical: 5 },
    md: { gap: space.xs, paddingHorizontal: space.md, paddingVertical: space.xs },
    label: { flexShrink: 1 },
});
