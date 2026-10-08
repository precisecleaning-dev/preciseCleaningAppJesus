// src/components/ui/SegmentedTabs.tsx
// Pestañas con indicador que se desliza con resorte hasta la opción elegida.
import { useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { motion } from '../../theme/tokens';
import AppText from './AppText';
import { styles } from './SegmentedTabs.styles';

interface Option<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}

export default function SegmentedTabs<T extends string>({ options, value, onChange }: Props<T>) {
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const itemW = width / options.length;
  const indicator = useAnimatedStyle(() => ({
    width: itemW,
    transform: [{ translateX: withSpring(index * itemW, motion.spring) }],
  }));

  return (
    <View style={styles.wrap} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width - 8)} accessibilityRole="tablist">
      {width > 0 && <Animated.View style={[styles.indicator, indicator]} />}
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (!active) Haptics.selectionAsync().catch(() => undefined);
              onChange(o.value);
            }}
            style={styles.item}
          >
            <AppText variant="caption" style={active ? styles.labelActive : styles.label}>
              {o.label}
            </AppText>
            {typeof o.count === 'number' && (
              <View style={[styles.count, active && styles.countActive]}>
                <AppText variant="caption" style={active ? styles.countTextActive : styles.countText}>
                  {o.count}
                </AppText>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
