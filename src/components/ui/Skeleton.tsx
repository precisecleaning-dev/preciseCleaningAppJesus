// src/components/ui/Skeleton.tsx
// ⭐ Carga animada: bloques con un brillo que barre de izquierda a derecha,
//    con la forma de lo que va a aparecer (no un spinner genérico).
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { gradients } from '../../theme/tokens';
import { styles } from './Skeleton.styles';

interface Props {
  width?: DimensionValue;
  height?: number;
  round?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonBlock({ width = '100%', height = 14, round, style }: Props) {
  const reduce = useReducedMotion();
  const x = useSharedValue(-1);
  useEffect(() => {
    if (!reduce) x.set(withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.quad) }), -1, false));
  }, [reduce, x]);
  const shine = useAnimatedStyle(() => ({ transform: [{ translateX: `${x.value * 120}%` }] }));
  return (
    <View style={[styles.block, round && styles.round, { width, height }, style]}>
      <Animated.View style={[styles.shine, shine]}>
        <LinearGradient colors={gradients.shimmer} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.fill} />
      </Animated.View>
    </View>
  );
}

/** Tarjeta de casa "fantasma" mientras llegan los datos. */
export function JobCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <SkeletonBlock width={44} height={44} round />
        <View style={styles.col}>
          <SkeletonBlock width="70%" height={15} />
          <SkeletonBlock width="45%" height={12} />
        </View>
      </View>
      <SkeletonBlock width="90%" height={12} />
      <View style={styles.row}>
        <SkeletonBlock width={80} height={22} />
        <SkeletonBlock width={70} height={22} />
      </View>
    </View>
  );
}
