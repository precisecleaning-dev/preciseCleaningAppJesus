import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import { FlatList, Modal, Pressable, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/tokens';
import { styles } from './PhotoViewer.styles';
import { t } from '../constants/strings';

interface Props {
  uris: string[];
  index: number | null;
  onClose: () => void;
}

export default function PhotoViewer({ uris, index, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  return (
    <Modal visible={index !== null} animationType="none" transparent onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView style={styles.backdrop}>
        <View style={styles.toolbar}>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t.close} style={styles.close}>
            <X size={26} color={colors.white} />
          </Pressable>
        </View>
        {index !== null && (
          <FlatList
            horizontal
            pagingEnabled
            data={uris}
            initialScrollIndex={index}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            keyExtractor={(u, i) => `${u}-${i}`}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => <Image source={{ uri: item }} style={{ width, height: height * 0.8 }} contentFit="contain" />}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}
