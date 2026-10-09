import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients } from '../../theme/tokens';
import AppText from './AppText';
import { styles } from './TabBar.styles';

interface Props extends BottomTabBarProps {
  icons: Record<string, LucideIcon>;
  labels: Record<string, string>;
}

export default function TabBar({ state, navigation, icons, labels }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar} accessibilityRole="tablist">
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const Icon = icons[route.name];
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={labels[route.name]}
              style={styles.item}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (focused || event.defaultPrevented) return;
                Haptics.selectionAsync().catch(() => undefined);
                navigation.navigate(route.name, route.params);
              }}
            >
              {focused && <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pill} />}
              <Icon size={22} color={focused ? colors.white : colors.textMuted} strokeWidth={2.2} />
              <AppText variant="caption" style={focused ? styles.labelOn : styles.label} numberOfLines={1}>
                {labels[route.name]}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
