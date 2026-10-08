// src/components/Segmented.tsx
import { Pressable, Text, View } from 'react-native';
import { styles } from './Segmented.styles';

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

export default function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.wrap} accessibilityRole="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={[styles.item, active && styles.itemActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {o.label}
              {typeof o.count === 'number' ? ` (${o.count})` : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
