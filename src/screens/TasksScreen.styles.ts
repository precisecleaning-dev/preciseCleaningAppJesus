import { StyleSheet } from 'react-native';
import { colors, space, TAB_BAR_SPACE } from '../theme/tokens';

export const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    list: { paddingBottom: TAB_BAR_SPACE },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    titles: { flex: 1, minWidth: 0 },
    filterRow: { flexDirection: 'row', marginTop: space.sm },
    segment: { paddingHorizontal: space.md, paddingTop: space.lg },
    tabs: { paddingHorizontal: space.md, paddingTop: space.sm, paddingBottom: space.sm },
    item: { paddingHorizontal: space.md, paddingBottom: space.sm },
    skeletons: { paddingHorizontal: space.md, paddingTop: space.lg },
});
