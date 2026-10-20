import { StyleSheet } from 'react-native';
import { accents, radius, shadow, space } from '../theme/tokens';

export const styles = StyleSheet.create({
    banner: {
        position: 'absolute',
        alignSelf: 'center',
        maxWidth: '92%',
        zIndex: 90,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.xs,
        backgroundColor: accents.amber.soft,
        paddingHorizontal: space.md,
        paddingVertical: space.xs,
        borderRadius: radius.pill,
        ...shadow.card,
    },
    text: { flexShrink: 1 },
});
