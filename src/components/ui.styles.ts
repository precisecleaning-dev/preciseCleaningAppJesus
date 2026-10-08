// src/components/ui.styles.ts
// ⭐ Estilos compartidos (equivalente a App.css/index.css de la web). Antes de
//    crear un estilo local en una pantalla, revisa si ya existe aquí.
import { StyleSheet } from 'react-native';
import { colors, font, radius, space, touchMin } from '../theme/tokens';

export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg, backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
  },
  sectionTitle: { fontSize: font.md, fontWeight: '700', color: colors.text, marginBottom: space.sm },
  muted: { fontSize: font.sm, color: colors.textMuted },
  empty: { fontSize: font.base, color: colors.textMuted, textAlign: 'center', paddingVertical: space.xl },
  row: { flexDirection: 'row', alignItems: 'center' },
  gapSm: { gap: space.sm },
  input: {
    minHeight: touchMin,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    fontSize: font.base,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  listContent: { padding: space.md, gap: space.sm, paddingBottom: space.xl },
});
