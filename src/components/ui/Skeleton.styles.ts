import { StyleSheet } from 'react-native';
import { colors, radius, shadow, space } from '../../theme/tokens';

export const styles = StyleSheet.create({
    block: { backgroundColor: colors.skeleton, borderRadius: radius.sm },
    round: { borderRadius: radius.pill },
    card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.md, gap: space.sm, ...shadow.card },
    row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    col: { flex: 1, gap: space.xs },
});
