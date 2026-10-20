import type { LucideIcon } from 'lucide-react-native';
import { useState, type ReactNode, type Ref } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { colors } from '../../theme/tokens';
import { styles } from './TextField.styles';

interface Props extends TextInputProps {
    ref?: Ref<TextInput>;
    icon?: LucideIcon;
    right?: ReactNode;
    invalid?: boolean;
}

export default function TextField({ ref, icon: Icon, right, invalid, onFocus, onBlur, style, ...rest }: Props) {
    const [focused, setFocused] = useState(false);
    return (
        <View style={[styles.wrap, focused && styles.focused, invalid && styles.invalid]}>
            {Icon && <Icon size={20} color={focused ? colors.primary : colors.textSoft} strokeWidth={2} />}
            <TextInput
                ref={ref}
                placeholderTextColor={colors.textSoft}
                {...rest}
                onFocus={(e) => {
                    setFocused(true);
                    onFocus?.(e);
                }}
                onBlur={(e) => {
                    setFocused(false);
                    onBlur?.(e);
                }}
                style={[styles.input, style]}
            />
            {right}
        </View>
    );
}
