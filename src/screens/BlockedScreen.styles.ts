import { StyleSheet } from 'react-native';
import { colors, space } from '../theme/tokens';

export const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: space.lg, gap: space.md },
    action: { marginTop: space.lg },
});
