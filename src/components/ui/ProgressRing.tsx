import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { styles } from './ProgressRing.styles';

interface Props {
  size: number;
  stroke: number;
  progress: number;
  color: string;
  track: string;
  children?: ReactNode;
}

export default function ProgressRing({ size, stroke, progress, color, track, children }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const mid = size / 2;
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle cx={mid} cy={mid} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={mid}
          cy={mid}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(1, progress)))}
          transform={`rotate(-90 ${mid} ${mid})`}
        />
      </Svg>
      <View style={styles.center}>{children}</View>
    </View>
  );
}
