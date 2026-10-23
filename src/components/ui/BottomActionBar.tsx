import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './BottomActionBar.styles';

interface Props {
    children: ReactNode;
}

const MIN_BOTTOM_PADDING = 14;

const BottomActionBar = ({ children }: Props) => {
    const insets = useSafeAreaInsets();
    return <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, MIN_BOTTOM_PADDING) }]}>{children}</View>;
};

export default BottomActionBar;
