import { StyleSheet } from 'react-native';
import { colors, font, space } from '../theme/tokens';

export const styles = StyleSheet.create({
  title: { fontSize: font.lg, fontWeight: '700', color: colors.text, marginTop: space.md },
  body: { fontSize: font.base, color: colors.textMuted, textAlign: 'center', marginVertical: space.sm },
  action: { marginTop: space.lg, alignSelf: 'stretch' },
});
