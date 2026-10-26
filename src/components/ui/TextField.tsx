import type { LucideIcon } from 'lucide-react-native';
import { useState, type ReactNode, type Ref } from 'react';
import { TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { colors } from '../../theme/tokens';
import { styles } from './TextField.styles';

interface Props extends TextInputProps {
    ref?: Ref<TextInput>;
    icon?: LucideIcon;
    right?: ReactNode;
    invalid?: boolean;
    containerStyle?: StyleProp<ViewStyle>;
}

const TextField = ({ ref, icon: Icon, right, invalid, containerStyle, onFocus, onBlur, style, ...rest }: Props) => {
    const [isFocused, setFocused] = useState(false);
    return (
        <View style={[styles.wrap, isFocused && styles.focused, invalid && styles.invalid, containerStyle]}>
            {Icon && <Icon size={20} color={isFocused ? colors.primary : colors.textSoft} strokeWidth={2} />}
            <TextInput
                ref={ref}
                placeholderTextColor={colors.textSoft}
                {...rest}
                onFocus={(event) => {
                    setFocused(true);
                    onFocus?.(event);
                }}
                onBlur={(event) => {
                    setFocused(false);
                    onBlur?.(event);
                }}
                style={[styles.input, style]}
            />
            {right}
        </View>
    );
};

export default TextField;
