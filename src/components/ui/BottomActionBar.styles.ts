import { StyleSheet } from 'react-native';
import { colors, radius, shadow, space } from '../../theme/tokens';

export const styles = StyleSheet.create({
    bar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.surface,
        paddingHorizontal: space.lg,
        paddingTop: space.md,
        gap: space.xs,
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        ...shadow.raised,
    },
});
