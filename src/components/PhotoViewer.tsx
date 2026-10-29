import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import { FlatList, Modal, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/tokens';
import { styles } from './PhotoViewer.styles';
import Touchable from './ui/Touchable';
import { t } from '../constants/strings';

interface Props {
    uris: string[];
    index: number | null;
    onClose: () => void;
}

const PhotoViewer = ({ uris, index, onClose }: Props) => {
    const { width, height } = useWindowDimensions();
    return (
        <Modal visible={index !== null} animationType="none" transparent onRequestClose={onClose} statusBarTranslucent>
            <SafeAreaView style={styles.backdrop}>
                <View style={styles.toolbar}>
                    <Touchable onPress={onClose} accessibilityLabel={t.close} style={styles.close}>
                        <X size={26} color={colors.white} />
                    </Touchable>
                </View>
                {index !== null && (
                    <FlatList
                        horizontal
                        pagingEnabled
                        data={uris}
                        initialScrollIndex={index}
                        getItemLayout={(_, photoIndex) => ({ length: width, offset: width * photoIndex, index: photoIndex })}
                        keyExtractor={(uri, photoIndex) => `${uri}-${photoIndex}`}
                        showsHorizontalScrollIndicator={false}
                        renderItem={({ item: uri }) => <Image source={{ uri }} style={{ width, height: height * 0.8 }} contentFit="contain" />}
                    />
                )}
            </SafeAreaView>
        </Modal>
    );
};

export default PhotoViewer;
