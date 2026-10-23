import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { styles } from './Card.styles';

interface Props {
    children: ReactNode;
    isRaised?: boolean;
    style?: StyleProp<ViewStyle>;
}

const Card = ({ children, isRaised = false, style }: Props) => <View style={[styles.card, isRaised && styles.raised, style]}>{children}</View>;

export default Card;
