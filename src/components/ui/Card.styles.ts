import { StyleSheet } from 'react-native';
import { colors, radius, shadow, space } from '../../theme/tokens';

export const styles = StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: space.lg, ...shadow.card },
    raised: { ...shadow.raised },
});
