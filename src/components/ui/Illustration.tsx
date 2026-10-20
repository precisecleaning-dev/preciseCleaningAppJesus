import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { solidBg } from '../../theme/accentStyles';
import { colors, type AccentName } from '../../theme/tokens';
import { styles } from './Illustration.styles';

export type Orbits = [{ icon: LucideIcon; accent: AccentName }, { icon: LucideIcon; accent: AccentName }, { icon: LucideIcon; accent: AccentName }];

interface Props {
    icon: LucideIcon;
    gradient: readonly [string, string];
    orbits: Orbits;
    size: number;
}

const POSITIONS = [styles.posA, styles.posB, styles.posC];

export default function Illustration({ icon: Icon, gradient, orbits, size }: Props) {
    const core = size * 0.52;
    return (
        <View style={[styles.stage, { width: size, height: size }]}>
            <View style={[styles.halo, { width: size, height: size, borderRadius: size / 2 }]} />
            <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.core, { width: core, height: core, borderRadius: core / 2 }]}>
                <Icon size={core * 0.42} color={colors.white} strokeWidth={1.8} />
            </LinearGradient>
            {orbits.map(({ icon: OrbitIcon, accent }, i) => (
                <View key={i} style={[styles.orbit, POSITIONS[i], solidBg[accent]]}>
                    <OrbitIcon size={20} color={colors.white} strokeWidth={2.2} />
                </View>
            ))}
        </View>
    );
}
