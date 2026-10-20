import { StyleSheet } from 'react-native';
import { colors, space, TAB_BAR_SPACE } from '../theme/tokens';

export const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    content: { paddingBottom: TAB_BAR_SPACE, gap: space.md },
});
