import { StyleSheet } from 'react-native';
import { colors, radius, space } from '../../theme/tokens';

export const styles = StyleSheet.create({
    header: {
        paddingHorizontal: space.lg,
        borderBottomLeftRadius: radius.xl + 8,
        borderBottomRightRadius: radius.xl + 8,
        overflow: 'hidden',
        gap: space.md,
    },
    orb: { position: 'absolute', borderRadius: 999, backgroundColor: colors.orb, pointerEvents: 'none' },
    orbA: { width: 220, height: 220, top: -90, right: -60 },
    orbB: { width: 140, height: 140, bottom: -70, left: -40 },
});
