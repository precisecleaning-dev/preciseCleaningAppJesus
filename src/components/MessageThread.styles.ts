import { StyleSheet } from 'react-native';
import { accents, colors, radius, space, touchMin } from '../theme/tokens';

export const styles = StyleSheet.create({
    wrap: { gap: space.xs },
    bubble: { borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: space.sm, maxWidth: '88%', gap: 2 },
    mine: { backgroundColor: accents.brand.soft, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
    theirs: { backgroundColor: accents.teal.soft, alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
    pending: { opacity: 0.65, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary },
    composer: { flexDirection: 'row', alignItems: 'flex-end', gap: space.xs, marginTop: space.xs },
    inputContainer: { flex: 1, minHeight: touchMin },
    input: { maxHeight: 120, paddingTop: space.sm + 2, paddingBottom: space.sm },
    sendButton: { width: touchMin, height: touchMin, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
    sendDisabled: { opacity: 0.45 },
});
