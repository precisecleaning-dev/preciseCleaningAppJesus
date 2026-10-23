import { StyleSheet } from 'react-native';
import { accents, radius } from '../../theme/tokens';

export const styles = StyleSheet.create({
    choice: { borderRadius: radius.pill, borderWidth: 2, borderColor: 'transparent', padding: 2 },
    selected: { borderColor: accents.brand.solid },
});
