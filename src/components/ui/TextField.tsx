// src/components/ui/TextField.tsx
// Campo de texto con ícono; el borde toma el color de la marca al enfocar.
import type { LucideIcon } from 'lucide-react-native';
import { forwardRef, useState, type ReactNode } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { colors } from '../../theme/tokens';
import { styles } from './TextField.styles';

interface Props extends TextInputProps {
  icon?: LucideIcon;
  right?: ReactNode;
  invalid?: boolean;
}

const TextField = forwardRef<TextInput, Props>(function TextField({ icon: Icon, right, invalid, onFocus, onBlur, style, ...rest }, ref) {
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
});

export default TextField;
