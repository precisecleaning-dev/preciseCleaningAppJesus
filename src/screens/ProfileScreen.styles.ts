import { StyleSheet } from 'react-native';
import { colors, space, TAB_BAR_SPACE, type } from '../theme/tokens';

export const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    content: { paddingBottom: TAB_BAR_SPACE, gap: space.md },
    flex: { flex: 1, minWidth: 0, gap: 2 },
    identity: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    ring: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
    avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.xxs },
    card: { marginHorizontal: space.md, gap: space.md },
    statsCard: { marginTop: -60, flexDirection: 'row', alignItems: 'center', paddingVertical: space.md },
    stat: { flex: 1, alignItems: 'center', gap: 4 },
    statValue: { ...type.number, fontSize: 22, lineHeight: 28, color: colors.text, padding: 0, textAlign: 'center', alignSelf: 'stretch' },
    vr: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border },
    cardHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    syncList: { gap: space.xs },
    signOut: { marginHorizontal: space.md, gap: space.sm, marginTop: space.xs },
});
