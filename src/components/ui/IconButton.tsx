import type { LucideIcon } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { colors } from '../../theme/tokens';
import AppText from './AppText';
import { styles } from './IconButton.styles';
import Touchable from './Touchable';

interface Props {
    icon: LucideIcon;
    onPress: () => void;
    label: string;
    badge?: number;
}

export default function IconButton({ icon: Icon, onPress, label, badge = 0 }: Props) {
    const bump = useSharedValue(1);
    const swing = useSharedValue(0);
    const prevBadge = useRef(badge);
    useEffect(() => {
        const grew = badge > prevBadge.current;
        prevBadge.current = badge;
        if (!grew) return;
        bump.set(withSequence(withSpring(1.35, { damping: 6 }), withSpring(1)));
        swing.set(withSequence(withSpring(-14, { damping: 4, stiffness: 400 }), withSpring(10, { damping: 4, stiffness: 400 }), withSpring(0)));
    }, [badge, bump, swing]);
    const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: bump.value }] }));
    const iconStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${swing.value}deg` }] }));

    return (
        <Touchable onPress={onPress} accessibilityLabel={badge > 0 ? `${label}, ${badge}` : label} style={styles.btn}>
            <Animated.View style={iconStyle}>
                <Icon size={22} color={colors.white} strokeWidth={2.2} />
            </Animated.View>
            {badge > 0 && (
                <Animated.View style={[styles.badge, badgeStyle]}>
                    <AppText variant="caption" tone="inverse" style={styles.badgeText}>
                        {badge > 9 ? '9+' : badge}
                    </AppText>
                </Animated.View>
            )}
        </Touchable>
    );
}
