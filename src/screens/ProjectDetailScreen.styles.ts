import { StyleSheet } from 'react-native';
import { colors, space } from '../theme/tokens';

export const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    flex: { flex: 1 },
    scrollContent: { gap: space.md },
    content: { paddingHorizontal: space.md, gap: space.md },
    stateContent: { padding: space.md },
    headChips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, alignItems: 'center' },
    card: { gap: space.md },
    raisedCard: { marginTop: -40 },
    progressRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    progressText: { flex: 1, minWidth: 0, gap: 2 },
    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.xs },
    secondaryActions: { flexDirection: 'row', gap: space.sm },
});
