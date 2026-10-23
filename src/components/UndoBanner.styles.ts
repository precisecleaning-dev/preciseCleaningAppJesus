import { StyleSheet } from 'react-native';
import { colors, radius, shadow, space, TAB_BAR_SPACE } from '../theme/tokens';

export const styles = StyleSheet.create({
    wrap: { position: 'absolute', left: space.md, right: space.md, bottom: TAB_BAR_SPACE, pointerEvents: 'box-none' },
    banner: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.text, borderRadius: radius.lg, paddingLeft: space.md, ...shadow.raised },
    message: { flex: 1 },
    undoButton: { paddingHorizontal: space.md, paddingVertical: space.sm },
});
