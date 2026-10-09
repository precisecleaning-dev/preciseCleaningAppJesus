import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gradients } from '../../theme/tokens';
import { styles } from './GradientHeader.styles';

interface Props {
  children: ReactNode;

  overlap?: number;
}

export default function GradientHeader({ children, overlap = 0 }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 10, paddingBottom: 22 + overlap }]}>
      <View style={[styles.orb, styles.orbA]} />
      <View style={[styles.orb, styles.orbB]} />
      {children}
    </LinearGradient>
  );
}
