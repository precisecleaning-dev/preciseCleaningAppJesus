import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';
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
  return (
    <View style={styles.wrap} accessibilityRole="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (active) return;
              Haptics.selectionAsync().catch(() => undefined);
              onChange(o.value);
            }}
            style={[styles.item, active && styles.itemActive]}
          >
            <AppText variant="caption" style={active ? styles.labelActive : styles.label}>
              {o.label}
            </AppText>
            {o.count !== undefined && (
              <View style={[styles.count, active && styles.countActive]}>
                <AppText variant="caption" style={[styles.countText, active && styles.countTextActive]}>
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
