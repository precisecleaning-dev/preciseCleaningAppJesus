// src/components/LoadingScreen.tsx
// Pantalla de espera con la marca (p. ej. justo después de iniciar sesión,
// mientras llega el perfil). Nunca una pantalla en blanco.
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { colors, gradients } from '../theme/tokens';
import { styles } from './LoadingScreen.styles';

export default function LoadingScreen() {
  return (
    <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fill}>
      <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.box}>
        <Image source={require('../../assets/logo-mark.png')} style={styles.logo} contentFit="contain" />
      </Animated.View>
      <View style={styles.spinner}>
        <ActivityIndicator color={colors.white} size="large" />
      </View>
    </LinearGradient>
  );
}
