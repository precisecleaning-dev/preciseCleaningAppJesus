import { StyleSheet } from 'react-native';
import { space, touchMin } from '../theme/tokens';

export const styles = StyleSheet.create({
    flex: { flex: 1 },
    content: { padding: space.md, gap: space.md, paddingBottom: space.xxl * 3 },
    fieldRow: { flexDirection: 'row' },
    choices: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
    multilineInput: { minHeight: 72, textAlignVertical: 'top' },
    taskBlock: { gap: space.xs },
    taskRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
    assigneeRow: { flexDirection: 'row', marginRight: touchMin + space.xs },
    removeTaskButton: { width: touchMin, height: touchMin, alignItems: 'center', justifyContent: 'center' },
});
