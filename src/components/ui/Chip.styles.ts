import { StyleSheet } from 'react-native';
import { colors, radius, space } from '../../theme/tokens';

export const styles = StyleSheet.create({
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
        borderRadius: radius.pill,
        paddingHorizontal: space.sm,
        paddingVertical: 4,
        maxWidth: '100%',
    },
    glass: { backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder },
    dot: { width: 8, height: 8, borderRadius: 4 },
    dotRing: { borderWidth: 1, borderColor: colors.white },
    text: { flexShrink: 1 },
    textDefault: { color: colors.text },
    textOnDark: { color: colors.white },
});
