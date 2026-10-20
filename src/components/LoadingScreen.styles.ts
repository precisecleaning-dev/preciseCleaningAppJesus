import { StyleSheet } from 'react-native';
import { colors, radius, shadow, space } from '../theme/tokens';

export const styles = StyleSheet.create({
    fill: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xl },
    box: { width: 104, height: 104, borderRadius: radius.xl, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', ...shadow.raised },
    logo: { width: 74, height: 74 },
    spinner: { height: 40 },
});
