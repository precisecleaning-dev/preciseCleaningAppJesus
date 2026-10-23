import type { ReactNode } from 'react';
import { View } from 'react-native';
import { styles } from './StripeCard.styles';
import Touchable from './Touchable';

interface Props {
    stripeColor: string;
    onPress: () => void;
    accessibilityLabel: string;
    children: ReactNode;
}

const StripeCard = ({ stripeColor, onPress, accessibilityLabel, children }: Props) => (
    <Touchable onPress={onPress} style={styles.card} accessibilityLabel={accessibilityLabel}>
        <View style={[styles.stripe, { backgroundColor: stripeColor }]} />
        <View style={styles.body}>{children}</View>
    </Touchable>
);

export default StripeCard;
