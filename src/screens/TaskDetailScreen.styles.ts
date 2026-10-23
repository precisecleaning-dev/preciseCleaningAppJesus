import { StyleSheet } from 'react-native';
import { colors, space } from '../theme/tokens';

export const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    flex: { flex: 1 },
    scrollContent: { gap: space.md },
    content: { paddingHorizontal: space.md, gap: space.md },
    headChips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, alignItems: 'center' },
    stateContent: { padding: space.md },
    card: { gap: space.md },
    raisedCard: { marginTop: -40 },
    secondaryActions: { flexDirection: 'row', gap: space.sm },
});
