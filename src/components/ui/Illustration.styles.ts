import { StyleSheet } from 'react-native';
import { accents, shadow } from '../../theme/tokens';

export const styles = StyleSheet.create({
  stage: { alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  halo: { position: 'absolute', backgroundColor: accents.brand.soft },
  core: { alignItems: 'center', justifyContent: 'center' },
  orbit: { position: 'absolute', width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  posA: { top: '8%', left: '6%' },
  posB: { top: '14%', right: '2%' },
  posC: { bottom: '6%', left: '22%' },
});
