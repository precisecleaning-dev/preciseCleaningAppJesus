import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './StatusScrim.styles';

export default function StatusScrim() {
    const insets = useSafeAreaInsets();
    return <View style={[styles.scrim, { height: insets.top }]} />;
}
