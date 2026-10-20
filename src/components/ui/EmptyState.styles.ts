import { StyleSheet } from 'react-native';
import { space } from '../../theme/tokens';

export const styles = StyleSheet.create({
    wrap: { alignItems: 'center', paddingVertical: space.xl, gap: space.md },
    text: { gap: space.xs, paddingHorizontal: space.lg, maxWidth: 320 },
});
