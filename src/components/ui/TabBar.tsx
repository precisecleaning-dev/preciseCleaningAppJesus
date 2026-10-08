// src/components/ui/TabBar.tsx
// ⭐ Barra inferior flotante: una píldora con el degradado de la marca se desliza
//    con resorte hasta la pestaña activa, y el ícono activo "salta" un poco.
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, motion } from '../../theme/tokens';
import AppText from './AppText';
import { styles } from './TabBar.styles';

interface Props extends BottomTabBarProps {
  icons: Record<string, LucideIcon>;
  labels: Record<string, string>;
  badges?: Record<string, number>;
}

function TabItem({ focused, Icon, label, badge, onPress }: { focused: boolean; Icon: LucideIcon; label: string; badge: number; onPress: () => void }) {
  const lift = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    lift.set(withSpring(focused ? 1 : 0, motion.spring));
  }, [focused, lift]);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -2 * lift.value }, { scale: 1 + 0.08 * lift.value }] }));
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={label} onPress={onPress} style={styles.item}>
      <Animated.View style={iconStyle}>
        <Icon size={22} color={focused ? colors.white : colors.textMuted} strokeWidth={2.2} />
        {badge > 0 && <View style={styles.dot} />}
      </Animated.View>
      <AppText variant="caption" style={focused ? styles.labelOn : styles.label} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

export default function TabBar({ state, navigation, icons, labels, badges = {} }: Props) {
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const itemW = width / state.routes.length;
  const idx = state.index;
  const pill = useAnimatedStyle(() => ({ width: itemW - 4, transform: [{ translateX: withSpring(idx * itemW + 2, motion.spring) }] }));

  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar} onLayout={(e) => setWidth(e.nativeEvent.layout.width - 12)} accessibilityRole="tablist">
        {width > 0 && (
          <Animated.View style={[styles.pill, pill]}>
            <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pillFill} />
          </Animated.View>
        )}
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          return (
            <TabItem
              key={route.key}
              focused={focused}
              Icon={icons[route.name]}
              label={labels[route.name]}
              badge={badges[route.name] || 0}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) {
                  Haptics.selectionAsync().catch(() => undefined);
                  navigation.navigate(route.name, route.params);
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
}
