import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { styles } from './Touchable.styles';

interface Props extends Omit<PressableProps, 'style' | 'children'> {
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
    haptic?: 'light' | 'medium';
}

export default function Touchable({ children, style, haptic = 'light', onPress, ...rest }: Props) {
    return (
        <Pressable
            accessibilityRole="button"
            {...rest}
            onPress={(e) => {
                Haptics.impactAsync(haptic === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
                onPress?.(e);
            }}
            style={({ pressed }) => [style, pressed && styles.pressed]}
        >
            {children}
        </Pressable>
    );
}
