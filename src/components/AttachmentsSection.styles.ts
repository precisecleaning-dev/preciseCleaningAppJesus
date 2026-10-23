import { StyleSheet } from 'react-native';
import { colors, radius, space, touchMin } from '../theme/tokens';

const THUMBNAIL_SIZE = 76;

export const styles = StyleSheet.create({
    wrap: { gap: space.sm },
    thumbnails: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
    thumbnailSlot: { width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE },
    thumbnail: { width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.track },
    thumbnailImage: { width: '100%', height: '100%' },
    pending: { opacity: 0.65, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary },
    removeBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.text,
    },
    fileRow: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, backgroundColor: colors.field, paddingLeft: space.md },
    fileInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm, minHeight: touchMin },
    fileText: { flex: 1, minWidth: 0 },
    removeButton: { width: touchMin, height: touchMin, alignItems: 'center', justifyContent: 'center' },
    progressRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    progressText: { flex: 1 },
    addRow: { flexDirection: 'row', gap: space.xs },
    addButton: { flex: 1 },
});
