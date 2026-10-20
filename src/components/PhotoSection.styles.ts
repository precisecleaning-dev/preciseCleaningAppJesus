import { StyleSheet } from 'react-native';
import { accents, colors, radius, space } from '../theme/tokens';

const THUMB = 92;

export const styles = StyleSheet.create({
    wrap: { gap: space.sm },
    header: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    titles: { flex: 1, gap: 1 },
    sub: { color: accents.mint.ink },
    subPending: { color: accents.amber.ink },
    strip: { gap: space.xs, paddingVertical: 2 },
    thumb: { width: THUMB, height: THUMB, borderRadius: radius.md, backgroundColor: colors.border },
    thumbOverlay: {
        ...StyleSheet.absoluteFill,
        borderRadius: radius.md,
        backgroundColor: colors.scrim,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
    },
    addTile: { width: THUMB, height: THUMB, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1.5, borderStyle: 'dashed' },
    addCamera: { backgroundColor: accents.violet.soft, borderColor: accents.violet.solid },
    addGallery: { backgroundColor: accents.sky.soft, borderColor: accents.sky.solid },
    addCamText: { color: accents.violet.ink },
    addGalText: { color: accents.sky.ink },
});
