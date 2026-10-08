import { StyleSheet } from 'react-native';
import { colors, font, space, touchMin } from '../theme/tokens';

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: space.lg },
  logo: { width: 220, height: 146, alignSelf: 'center' },
  title: { fontSize: font.xl, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: space.sm },
  subtitle: { fontSize: font.base, color: colors.textMuted, textAlign: 'center', marginBottom: space.xl },
  form: { gap: space.sm },
  error: { color: colors.danger, fontSize: font.sm, fontWeight: '600' },
  link: { minHeight: touchMin, alignItems: 'center', justifyContent: 'center' },
  linkText: { color: colors.primary, fontSize: font.sm, fontWeight: '600' },
});
