// src/components/StatusPill.tsx
// Pastilla de color. El color viene de Firestore (configurable por la oficina),
// por eso es el ÚNICO valor que se pasa en tiempo de ejecución.
import { Text, View } from 'react-native';
import { styles } from './StatusPill.styles';

interface Props {
  label: string;
  color?: string;
  tone?: 'neutral' | 'progress' | 'done' | 'warning';
}

export default function StatusPill({ label, color, tone = 'neutral' }: Props) {
  if (color) {
    return (
      <View style={[styles.pill, { backgroundColor: `${color}22`, borderColor: color }]}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={[styles.text, styles.textOnColor]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    );
  }
  return (
    <View style={[styles.pill, styles[tone]]}>
      <Text style={[styles.text, styles[`${tone}Text`]]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
