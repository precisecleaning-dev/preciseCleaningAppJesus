import { CircleCheckBig } from 'lucide-react-native';
import { View } from 'react-native';
import { t } from '../constants/strings';
import { accents } from '../theme/tokens';
import { styles } from './UndoBanner.styles';
import AppText from './ui/AppText';
import Touchable from './ui/Touchable';

interface Props {
    message: string;
    onUndo: () => void;
}

const UndoBanner = ({ message, onUndo }: Props) => (
    <View style={styles.wrap} accessibilityRole="alert">
        <View style={styles.banner}>
            <CircleCheckBig size={20} color={accents.mint.solid} />
            <AppText variant="body" tone="inverse" style={styles.message} numberOfLines={1}>
                {message}
            </AppText>
            <Touchable onPress={onUndo} style={styles.undoButton} accessibilityLabel={t.undo}>
                <AppText variant="title" tone="inverse">
                    {t.undo}
                </AppText>
            </Touchable>
        </View>
    </View>
);

export default UndoBanner;
