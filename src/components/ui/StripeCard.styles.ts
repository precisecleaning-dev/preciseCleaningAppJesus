import { StyleSheet } from 'react-native';
import { colors, radius, shadow, space } from '../../theme/tokens';

export const styles = StyleSheet.create({
    card: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.lg, ...shadow.card },
    stripe: { width: 6, borderTopLeftRadius: radius.lg, borderBottomLeftRadius: radius.lg },
    body: { flex: 1, padding: space.md, gap: space.sm },
});
